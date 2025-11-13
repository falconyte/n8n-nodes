import type {
	IDataObject,
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	WorkflowExecuteMode,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createHmac, timingSafeEqual } from 'crypto';
import { appendFileSync } from 'fs';

import { webhookEventOptions } from './descriptions/WebhookDescription';
import { falconyteRequest } from './helpers/api';

type FalKeyedContext = IHookFunctions | IWebhookFunctions;
type FalconyteTriggerStaticData = IDataObject & {
	webhookId?: string;
	secret?: string;
	prodWebhookId?: string;
	prodWebhookSecret?: string;
	testWebhookId?: string;
	testWebhookSecret?: string;
};

function migrateLegacyStaticData(staticData: FalconyteTriggerStaticData): void {
	if (staticData.webhookId && !staticData.prodWebhookId) {
		staticData.prodWebhookId = staticData.webhookId as string;
	}

	if (staticData.secret && !staticData.prodWebhookSecret) {
		staticData.prodWebhookSecret = staticData.secret as string;
	}

	delete staticData.webhookId;
	delete staticData.secret;
}

function getStorageKeys(mode: WorkflowExecuteMode): {
	idKey: 'testWebhookId' | 'prodWebhookId';
	secretKey: 'testWebhookSecret' | 'prodWebhookSecret';
} {
	if (mode === 'manual') {
		return {
			idKey: 'testWebhookId',
			secretKey: 'testWebhookSecret',
		};
	}

	return {
		idKey: 'prodWebhookId',
		secretKey: 'prodWebhookSecret',
	};
}

function logDebug(context: FalKeyedContext, message: string, data: IDataObject = {}): void {
	const payload = {
		...data,
		mode: typeof (context as IHookFunctions).getMode === 'function' ? (context as IHookFunctions).getMode() : undefined,
		timestamp: new Date().toISOString(),
	};

	const line = `[FalconyteTrigger] ${message} ${JSON.stringify(payload)}\n`;

	try {
		appendFileSync('/tmp/falconyte-trigger.log', line, 'utf8');
	} catch (error) {
		// ignore fs errors
	}

	console.log(line.trim()); // eslint-disable-line no-console
}

async function falconyteApiRequest(
	this: FalKeyedContext,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	return (await falconyteRequest.call(this as never, {
		method,
		url: endpoint,
		body: Object.keys(body).length ? body : undefined,
		qs: Object.keys(qs).length ? qs : undefined,
	})) as IDataObject;
}

function parseSignatureHeader(headerValue: string): { timestamp: string; signature: string } {
	const segments = headerValue.split(',').map((segment) => segment.trim());
	const data: Record<string, string> = {};

	for (const segment of segments) {
		const [key, value] = segment.split('=');
		if (key && value) {
			data[key] = value;
		}
	}

	if (!data.t || !data.v1) {
		throw new Error('Invalid X-FY-Signature header.');
	}

	return {
		timestamp: data.t,
		signature: data.v1,
	};
}

export class FalconyteTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Falconyte Trigger',
		name: 'falconyteTrigger',
		group: ['trigger'],
		version: 1,
		description: 'Receive real-time events from Falconyte webhooks',
		subtitle: 'Automate workflows from Falconyte webhook activity.',
		icon: 'file:falconyte.svg',
		defaults: {
			name: 'Falconyte Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'falconyteApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'eventsUi',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Event',
				default: {},
				options: [
					{
						displayName: 'Event',
						name: 'eventValues',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'options',
								options: webhookEventOptions,
								default: 'email.sent',
								required: true,
							},
						],
					},
				],
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				responseData: 'default',
				path: 'webhook',
			},
		],
	};

	webhookMethods: INodeType['webhookMethods'] = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as FalconyteTriggerStaticData;
				migrateLegacyStaticData(staticData);

				const mode = this.getMode();
				const { idKey, secretKey } = getStorageKeys(mode);
				const webhookId = staticData[idKey] as string | undefined;

				logDebug(this, 'checkExists called', { mode, webhookId });

				if (!webhookId) {
					return false;
				}

				try {
					const response = await falconyteApiRequest.call(
						this,
						'GET',
						`/public/v1/webhooks/${webhookId}`,
					);

					const webhook = response.webhook as IDataObject | undefined;

					if (!webhook) {
						return false;
					}

					if (webhook.secret) {
						staticData[secretKey] = webhook.secret as string;
					}

					if (webhook.is_enabled === false) {
						const enableResponse = await falconyteApiRequest.call(
							this,
							'PATCH',
							`/public/v1/webhooks/${webhookId}`,
							{ is_enabled: true, source: 'n8n' },
						);

						const updatedWebhook = enableResponse.webhook as IDataObject | undefined;
						if (updatedWebhook?.secret) {
							staticData[secretKey] = updatedWebhook.secret as string;
						}
					}

					return true;
				} catch (error) {
					if ((error as { httpCode?: string })?.httpCode === '404') {
						delete staticData[idKey];
						delete staticData[secretKey];
						logDebug(this, 'Existing webhook not found; clearing static data', { mode, webhookId });
						return false;
					}

					logDebug(this, 'checkExists encountered error', {
						mode,
						webhookId,
						error: error instanceof Error ? error.message : 'unknown',
					});

					throw error;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const eventsUi = this.getNodeParameter('eventsUi') as IDataObject | undefined;
				const eventValues = (eventsUi?.eventValues as IDataObject[]) || [];
				const events = eventValues
					.map((event) => event.name as string)
					.filter((name): name is string => Boolean(name));

				const staticData = this.getWorkflowStaticData('node') as FalconyteTriggerStaticData;
				migrateLegacyStaticData(staticData);

				const mode = this.getMode();
				const { idKey, secretKey } = getStorageKeys(mode);

				logDebug(this, 'create called', {
					mode,
					webhookUrl,
					idKey,
					hasExistingId: Boolean(staticData[idKey]),
					eventsCount: events.length,
				});

				if (!events.length) {
					throw new NodeOperationError(this.getNode(), 'Select at least one event to subscribe to.');
				}

				const existingWebhookId = staticData[idKey] as string | undefined;

				if (existingWebhookId) {
					try {
						const response = await falconyteApiRequest.call(
							this,
							'PATCH',
							`/public/v1/webhooks/${existingWebhookId}`,
							{
								url: webhookUrl,
								events,
								is_enabled: true,
								source: 'n8n',
							},
						);

						const webhook = response.webhook as IDataObject | undefined;
						if (webhook?.secret) {
							staticData[secretKey] = webhook.secret as string;
						}

						logDebug(this, 'Existing webhook updated', { mode, webhookId: existingWebhookId });

						return true;
					} catch (error) {
						if ((error as { httpCode?: string })?.httpCode !== '404') {
							logDebug(this, 'Failed to update existing webhook', {
								mode,
								webhookId: existingWebhookId,
								error: error instanceof Error ? error.message : 'unknown',
							});
							throw error;
						}

						delete staticData[idKey];
						delete staticData[secretKey];
						logDebug(this, 'Existing webhook missing; creating new', { mode, webhookId: existingWebhookId });
					}
				}

				const response = await falconyteApiRequest.call(this, 'POST', '/public/v1/webhooks', {
					url: webhookUrl,
					events,
					is_enabled: true,
					source: 'n8n',
				});

				const webhook = response.webhook as IDataObject | undefined;

				if (!webhook?.id || !webhook?.secret) {
					throw new NodeOperationError(
						this.getNode(),
						'Falconyte webhook creation response is missing id or secret.',
					);
				}

				staticData[idKey] = webhook.id as string;
				staticData[secretKey] = webhook.secret as string;

				logDebug(this, 'Created new webhook', {
					mode,
					webhookId: staticData[idKey],
				});

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as FalconyteTriggerStaticData;
				migrateLegacyStaticData(staticData);

				const mode = this.getMode();
				const { idKey, secretKey } = getStorageKeys(mode);
				const webhookId = staticData[idKey] as string | undefined;

				logDebug(this, 'delete called', { mode, webhookId });

				if (webhookId) {
					try {
						await falconyteApiRequest.call(
							this,
							'DELETE',
							`/public/v1/webhooks/${webhookId}`,
						);
					} catch (error) {
						if ((error as { httpCode?: string })?.httpCode === '404') {
							delete staticData[idKey];
							delete staticData[secretKey];
							return true;
						}

						logDebug(this, 'Failed to delete webhook', {
							mode,
							webhookId,
							error: error instanceof Error ? error.message : 'unknown',
						});

						throw error as Error;
					}
				}

				delete staticData[idKey];
				delete staticData[secretKey];

				logDebug(this, 'Cleared webhook static data', { mode });

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();
		const staticData = this.getWorkflowStaticData('node') as FalconyteTriggerStaticData;
		migrateLegacyStaticData(staticData);

		const mode = this.getMode();
		const { idKey, secretKey } = getStorageKeys(mode);

		logDebug(this, 'Incoming webhook received', {
			mode,
			webhookId: staticData[idKey],
		});

		const secret = staticData[secretKey] as string | undefined;
		if (!secret) {
			res.status(500).send('Webhook secret is missing. Reinitialize the trigger.');
			return { workflowData: [] };
		}

		const signatureHeader = req.headers['x-fy-signature'];
		if (typeof signatureHeader !== 'string') {
			res.status(400).send('Missing X-FY-Signature header.');
			return { workflowData: [] };
		}

		let parsedSignature: { timestamp: string; signature: string };
		try {
			parsedSignature = parseSignatureHeader(signatureHeader);
		} catch (error) {
			res.status(400).send('Invalid signature header.');
			return { workflowData: [] };
		}

		const body = req.body as IDataObject;
		const serializedBody = JSON.stringify(body);
		const computedSignature = createHmac('sha256', secret)
			.update(`${parsedSignature.timestamp}.${serializedBody}`)
			.digest('hex');

		const expectedBuffer = Buffer.from(computedSignature);
		const receivedBuffer = Buffer.from(parsedSignature.signature);

		if (
			expectedBuffer.length !== receivedBuffer.length ||
			!timingSafeEqual(expectedBuffer, receivedBuffer)
		) {
			res.status(403).send('Signature verification failed.');
			return { workflowData: [] };
		}

		res.json({ ok: true });

		return {
			workflowData: [
				[
					{
						json: {
							...body,
							metadata: {
								event: body.event,
								webhookId: staticData[idKey],
								mode,
								signatureTimestamp: parsedSignature.timestamp,
							},
						},
						headers: req.headers as IDataObject,
					},
				],
			],
		};
	}
}


