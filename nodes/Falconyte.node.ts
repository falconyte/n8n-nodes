import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse } from 'n8n-workflow';
import { contactFields, contactOperations } from './descriptions/ContactDescription';
import { eventFields, eventOperations } from './descriptions/EventDescription';
import { unsubscribeFields, unsubscribeOperations } from './descriptions/UnsubscribeDescription';
import { webhookFields, webhookOperations } from './descriptions/WebhookDescription';
import { falconyteRequest } from './helpers/api';
import {
	buildContactUpsertPayload,
	buildContactsArray,
	buildBulkUnsubscribePayload,
	buildEventPayload,
	buildUnsubscribeSinglePayload,
	buildWebhookCreatePayload,
	buildWebhookDeliveriesQuery,
} from './helpers/payloadBuilders';

type FalconyteResource = 'contact' | 'event' | 'unsubscribe' | 'webhook';
const PUBLIC_API_PREFIX = '/public/v1';

const buildUrl = (path: string) => `${PUBLIC_API_PREFIX}${path}`;

export class Falconyte implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Falconyte',
		name: 'falconyte',
		icon: 'file:falconyte.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Sync contacts, ingest lifecycle events, manage unsubscribes, and automate webhook workflows with Falconyte.',
		defaults: {
			name: 'Falconyte',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'falconyteApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials?.baseUrl}}',
			json: true,
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				noDataExpression: true,
				type: 'options',
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Event',
						value: 'event',
					},
					{
						name: 'Unsubscribe',
						value: 'unsubscribe',
					},
					{
						name: 'Webhook',
						value: 'webhook',
					},
				],
				default: 'contact',
			},
			...contactOperations,
			...contactFields,
			...eventOperations,
			...eventFields,
			...unsubscribeOperations,
			...unsubscribeFields,
			...webhookOperations,
			...webhookFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as FalconyteResource;

				const responseData = await handleResource.call(this, resource, itemIndex);

				returnData.push({
					json: responseData as IDataObject,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: itemIndex,
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function handleResource(this: IExecuteFunctions, resource: FalconyteResource, index: number) {
	if (resource === 'contact') {
		return await handleContact.call(this, index);
	}
	if (resource === 'event') {
		return await handleEvent.call(this, index);
	}
	if (resource === 'unsubscribe') {
		return await handleUnsubscribe.call(this, index);
	}
	if (resource === 'webhook') {
		return await handleWebhook.call(this, index);
	}
	throw new Error(`Unsupported resource: ${resource}`);
}

async function handleContact(this: IExecuteFunctions, index: number) {
	const operation = this.getNodeParameter('operation', index) as 'upsert' | 'bulkUpsert';

	if (operation === 'upsert') {
		const email = this.getNodeParameter('email', index) as string;
		const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

		const body = buildContactUpsertPayload(email, additionalFields);

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/email/contacts/upsert'),
			body,
		});
	}

	if (operation === 'bulkUpsert') {
		const contactsRaw = this.getNodeParameter('contacts', index) as string | IDataObject[];

		const contacts = buildContactsArray(contactsRaw);
		const tagsRaw = this.getNodeParameter('tags', index, '') as string | IDataObject;
		const payload: IDataObject = {
			contacts,
		};

		if (tagsRaw && ((typeof tagsRaw === 'string' && tagsRaw !== '') || typeof tagsRaw === 'object')) {
			payload.tags = typeof tagsRaw === 'string' ? jsonParse(tagsRaw) : tagsRaw;
		}

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/email/contacts/bulk-upsert'),
			body: payload,
		});
	}

	throw new Error(`Unsupported contact operation: ${operation}`);
}

async function handleEvent(this: IExecuteFunctions, index: number) {
	const operation = this.getNodeParameter('operation', index) as 'submit' | 'get' | 'getDecisions';

	if (operation === 'submit') {
		const body = buildEventPayload({
			eventName: this.getNodeParameter('event_name', index) as string,
			email: this.getNodeParameter('email', index, '') as string,
			idempotencyKey: this.getNodeParameter('idempotency_key', index, '') as string,
			occurredAt: this.getNodeParameter('occurred_at', index, '') as string,
			payload: this.getNodeParameter('payload', index, '') as string | IDataObject,
		});

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/email/events'),
			body,
		});
	}

	if (operation === 'get') {
		const eventId = this.getNodeParameter('eventId', index) as string;

		return await requestFalconyte.call(this, {
			method: 'GET',
			url: buildUrl(`/email/events/${eventId}`),
		});
	}

	if (operation === 'getDecisions') {
		const eventId = this.getNodeParameter('eventId', index) as string;

		return await requestFalconyte.call(this, {
			method: 'GET',
			url: buildUrl(`/email/events/${eventId}/decisions`),
		});
	}

	throw new Error(`Unsupported event operation: ${operation}`);
}

async function handleUnsubscribe(this: IExecuteFunctions, index: number) {
	const operation = this.getNodeParameter('operation', index) as 'single' | 'bulk' | 'list';

	if (operation === 'single') {
		const body = buildUnsubscribeSinglePayload({
			email: this.getNodeParameter('email', index, '') as string,
			reason: this.getNodeParameter('reason', index, '') as string,
		});

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/email/contacts/unsubscribe'),
			body,
		});
	}

	if (operation === 'bulk') {
		const emailsRaw = this.getNodeParameter('emails', index) as string | IDataObject;
		const body = buildBulkUnsubscribePayload(emailsRaw);
		const reason = this.getNodeParameter('reason', index, '') as string;

		if (reason) {
			body.reason = reason;
		}

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/email/contacts/bulk-unsubscribe'),
			body,
		});
	}

	if (operation === 'list') {
		const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
		const qs: IDataObject = {};

		for (const [key, value] of Object.entries(filters)) {
			if (value === '' || value === null || value === undefined) continue;
			qs[key] = value;
		}

		return await requestFalconyte.call(this, {
			method: 'GET',
			url: buildUrl('/email/contacts/unsubscribes'),
			qs,
		});
	}

	throw new Error(`Unsupported unsubscribe operation: ${operation}`);
}

async function handleWebhook(this: IExecuteFunctions, index: number) {
	const operation = this.getNodeParameter('operation', index) as
		| 'list'
		| 'create'
		| 'delete'
		| 'get'
		| 'enable'
		| 'disable'
		| 'update'
		| 'listDeliveries'
		| 'simulate';

	if (operation === 'list') {
		const pagination = (this.getNodeParameter('pagination', index, {}) as IDataObject) || {};

		return await requestFalconyte.call(this, {
			method: 'GET',
			url: buildUrl('/webhooks'),
			qs: pagination,
		});
	}

	if (operation === 'create') {
		const url = this.getNodeParameter('url', index) as string;
		const events = this.getNodeParameter('events', index) as string[];
		const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

		const body = buildWebhookCreatePayload(url, events, additionalFields);

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/webhooks'),
			body,
		});
	}

	if (operation === 'delete') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;

		return await requestFalconyte.call(this, {
			method: 'DELETE',
			url: buildUrl(`/webhooks/${webhookId}`),
		});
	}

	if (operation === 'get') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;

		return await requestFalconyte.call(this, {
			method: 'GET',
			url: buildUrl(`/webhooks/${webhookId}`),
		});
	}

	if (operation === 'enable' || operation === 'disable') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;
		const action = operation === 'enable' ? 'enable' : 'disable';

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl(`/webhooks/${webhookId}/${action}`),
		});
	}

	if (operation === 'update') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;
		const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

		const body: IDataObject = {};

		if (typeof updateFields.url === 'string' && updateFields.url.trim() !== '') {
			body.url = updateFields.url;
		}

		if (Array.isArray(updateFields.events) && updateFields.events.length > 0) {
			body.events = updateFields.events;
		}

		if (Object.prototype.hasOwnProperty.call(updateFields, 'is_enabled')) {
			body.is_enabled = updateFields.is_enabled;
		}

		if (Object.keys(body).length === 0) {
			throw new Error('Select at least one field to update.');
		}

		return await requestFalconyte.call(this, {
			method: 'PATCH',
			url: buildUrl(`/webhooks/${webhookId}`),
			body,
		});
	}

	if (operation === 'listDeliveries') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;
		const pagination = (this.getNodeParameter('pagination', index, {}) as IDataObject) || {};
		const filtersRaw = this.getNodeParameter('filters', index, '') as string | IDataObject;

		const qs = buildWebhookDeliveriesQuery(pagination, filtersRaw);

		return await requestFalconyte.call(this, {
			method: 'GET',
			url: buildUrl(`/webhooks/${webhookId}/deliveries`),
			qs,
		});
	}

	if (operation === 'simulate') {
		const event = this.getNodeParameter('event', index) as string;

		return await requestFalconyte.call(this, {
			method: 'POST',
			url: buildUrl('/webhooks/simulate'),
			body: {
				event,
			},
		});
	}

	throw new Error(`Unsupported webhook operation: ${operation}`);
}

async function requestFalconyte(
	this: IExecuteFunctions,
	options: {
		method: IHttpRequestMethods;
		url: string;
		body?: IDataObject;
		qs?: IDataObject;
	},
) {
	return await falconyteRequest.call(this, options);
}

