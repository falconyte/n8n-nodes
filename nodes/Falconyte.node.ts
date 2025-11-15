import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse } from 'n8n-workflow';
import { emailFields, emailOperations } from './descriptions/EmailDescription';
import { falconyteRequest } from './helpers/api';
import {
	buildContactUpsertPayload,
	buildContactsArray,
	buildBulkUnsubscribePayload,
	buildEventPayload,
	buildUnsubscribeSinglePayload,
	buildWebhookCreatePayload,
	buildWebhookDeliveriesQuery,
	buildCampaignCreatePayload,
	buildCampaignSubmitPayload,
	buildEmailSendPayload,
	buildTemplateCreatePayload,
} from './helpers/payloadBuilders';

type FalconyteResource = 'email';
const PUBLIC_API_PREFIX = '/public/v1';

const buildUrl = (path: string) => `${PUBLIC_API_PREFIX}${path}`;

export class Falconyte implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Falconyte Email',
		name: 'falconyte',
		icon: 'file:falconyte.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: "Send emails using Falconyte's transactional email API.",
		defaults: {
			name: 'Falconyte Email',
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
						name: 'Email',
						value: 'email',
						description: 'Use Falconyte email functionality',
					},
				],
				default: 'email',
			},
			...emailOperations,
			...emailFields,
		],
	};

	methods = {
		loadOptions: {
			/**
			 * Load templates from Falconyte API for the Template dropdown.
			 * Fetches up to 100 templates from the first page.
			 * Response format: GET /public/v1/email/templates
			 * Returns: { ok: true, templates: { data: [{ id, name, subject, ... }] }, meta: {...} }
			 */
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const response = await falconyteRequest.call(this, {
						method: 'GET',
						url: `${PUBLIC_API_PREFIX}/email/templates`,
						qs: {
							per_page: 100,
						},
					}) as { templates: { data: Array<{ id: string; name: string; subject?: string }> } };

					if (!response.templates?.data || !Array.isArray(response.templates.data)) {
						return [];
					}

					return response.templates.data.map((template) => {
						const displayName = template.subject
							? `${template.name} - ${template.subject}`
							: template.name;
						return {
							name: displayName,
							value: template.id,
						};
					});
				} catch (error) {
					// Return empty array on error - n8n will show connection errors in UI
					return [];
				}
			},

			/**
			 * Load mail accounts from Falconyte API for the Mail Account dropdown.
			 * Response format: GET /public/v1/email/mail-accounts
			 * Returns: { ok: true, mail_accounts: [{ id, email, ... }] }
			 */
			async getMailAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const response = await falconyteRequest.call(this, {
						method: 'GET',
						url: `${PUBLIC_API_PREFIX}/email/mail-accounts`,
					}) as { mail_accounts: Array<{ id: string; email: string }> };

					if (!response.mail_accounts || !Array.isArray(response.mail_accounts)) {
						return [];
					}

					return response.mail_accounts.map((account) => ({
						name: account.email,
						value: account.id,
					}));
				} catch (error) {
					// Return empty array on error - n8n will show connection errors in UI
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as FalconyteResource;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let responseData: unknown;

				if (resource === 'email') {
					switch (operation) {
						case 'contactUpsert': {
							const email = this.getNodeParameter('email', itemIndex) as string;
							const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
							const body = buildContactUpsertPayload(email, additionalFields);
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/contacts/upsert'),
								body,
							});
							break;
						}
						case 'contactBulkUpsert': {
							const contactsRaw = this.getNodeParameter('contacts', itemIndex) as string | IDataObject[];
							const contacts = buildContactsArray(contactsRaw);
							const tagsRaw = this.getNodeParameter('tags', itemIndex, '') as string | IDataObject;
							const payload: IDataObject = { contacts };
							if (tagsRaw && ((typeof tagsRaw === 'string' && tagsRaw !== '') || typeof tagsRaw === 'object')) {
								payload.tags = typeof tagsRaw === 'string' ? jsonParse(tagsRaw) : tagsRaw;
							}
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/contacts/bulk-upsert'),
								body: payload,
							});
							break;
						}
						case 'eventSubmit': {
							const body = buildEventPayload({
								eventName: this.getNodeParameter('event_name', itemIndex) as string,
								email: this.getNodeParameter('email', itemIndex, '') as string,
								idempotencyKey: this.getNodeParameter('idempotency_key', itemIndex, '') as string,
								occurredAt: this.getNodeParameter('occurred_at', itemIndex, '') as string,
								payload: this.getNodeParameter('payload', itemIndex, '') as string | IDataObject,
							});
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/events'),
								body,
							});
							break;
						}
						case 'eventGet': {
							const eventId = this.getNodeParameter('eventId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl(`/email/events/${eventId}`),
							});
							break;
						}
						case 'eventGetDecisions': {
							const eventId = this.getNodeParameter('eventId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl(`/email/events/${eventId}/decisions`),
							});
							break;
						}
						case 'unsubscribeContact': {
							const body = buildUnsubscribeSinglePayload({
								email: this.getNodeParameter('email', itemIndex, '') as string,
								reason: this.getNodeParameter('reason', itemIndex, '') as string,
							});
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/contacts/unsubscribe'),
								body,
							});
							break;
						}
						case 'unsubscribeBulk': {
							const emailsRaw = this.getNodeParameter('emails', itemIndex) as string | IDataObject;
							const body = buildBulkUnsubscribePayload(emailsRaw);
							const reason = this.getNodeParameter('reason', itemIndex, '') as string;
							if (reason) {
								body.reason = reason;
							}
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/contacts/bulk-unsubscribe'),
								body,
							});
							break;
						}
						case 'unsubscribeList': {
							const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
							const qs: IDataObject = {};
							for (const [key, value] of Object.entries(filters)) {
								if (value === '' || value === null || value === undefined) continue;
								qs[key] = value;
							}
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl('/email/contacts/unsubscribes'),
								qs,
							});
							break;
						}
						case 'webhookList': {
							const pagination = (this.getNodeParameter('pagination', itemIndex, {}) as IDataObject) || {};
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl('/webhooks'),
								qs: pagination,
							});
							break;
						}
						case 'webhookCreate': {
							const url = this.getNodeParameter('url', itemIndex) as string;
							const events = this.getNodeParameter('events', itemIndex) as string[];
							const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
							const body = buildWebhookCreatePayload(url, events, additionalFields);
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/webhooks'),
								body,
							});
							break;
						}
						case 'webhookDelete': {
							const webhookId = this.getNodeParameter('webhookId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'DELETE',
								url: buildUrl(`/webhooks/${webhookId}`),
							});
							break;
						}
						case 'webhookGet': {
							const webhookId = this.getNodeParameter('webhookId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl(`/webhooks/${webhookId}`),
							});
							break;
						}
						case 'webhookEnable':
						case 'webhookDisable': {
							const webhookId = this.getNodeParameter('webhookId', itemIndex) as string;
							const action = operation === 'webhookEnable' ? 'enable' : 'disable';
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl(`/webhooks/${webhookId}/${action}`),
							});
							break;
						}
						case 'webhookUpdate': {
							const webhookId = this.getNodeParameter('webhookId', itemIndex) as string;
							const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
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
							responseData = await requestFalconyte.call(this, {
								method: 'PATCH',
								url: buildUrl(`/webhooks/${webhookId}`),
								body,
							});
							break;
						}
						case 'webhookListDeliveries': {
							const webhookId = this.getNodeParameter('webhookId', itemIndex) as string;
							const pagination = (this.getNodeParameter('pagination', itemIndex, {}) as IDataObject) || {};
							const filtersRaw = this.getNodeParameter('filters', itemIndex, '') as string | IDataObject;
							const qs = buildWebhookDeliveriesQuery(pagination, filtersRaw);
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl(`/webhooks/${webhookId}/deliveries`),
								qs,
							});
							break;
						}
						case 'webhookSimulate': {
							const event = this.getNodeParameter('event', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/webhooks/simulate'),
								body: { event },
							});
							break;
						}
						case 'campaignList': {
							const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
							const qs: IDataObject = {};
							for (const [key, value] of Object.entries(filters)) {
								if (value === '' || value === null || value === undefined) continue;
								qs[key] = value;
							}
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl('/email/campaigns'),
								qs,
							});
							break;
						}
						case 'campaignCreate': {
							const name = this.getNodeParameter('name', itemIndex) as string;
							const templateIds = this.getNodeParameter('template_ids', itemIndex) as string | IDataObject[];
							const mailAccountIds = this.getNodeParameter('mail_account_ids', itemIndex) as string | IDataObject[];
							const events = this.getNodeParameter('events', itemIndex) as string[];
							const body = buildCampaignCreatePayload({ name, templateIds, mailAccountIds, events });
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/campaigns'),
								body,
							});
							break;
						}
						case 'campaignSubmit': {
							const campaignId = this.getNodeParameter('campaignId', itemIndex) as string;
							const eventName = this.getNodeParameter('event_name', itemIndex) as string;
							const email = this.getNodeParameter('email', itemIndex, '') as string;
							const idempotencyKey = this.getNodeParameter('idempotency_key', itemIndex, '') as string;
							const body = buildCampaignSubmitPayload({ eventName, email, idempotencyKey });
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl(`/email/campaigns/${campaignId}/submit`),
								body,
							});
							break;
						}
						case 'campaignStart': {
							const campaignId = this.getNodeParameter('campaignId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl(`/email/campaigns/${campaignId}/start`),
							});
							break;
						}
						case 'campaignStop': {
							const campaignId = this.getNodeParameter('campaignId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl(`/email/campaigns/${campaignId}/stop`),
							});
							break;
						}
						case 'emailSend': {
							const templateId = this.getNodeParameter('template_id', itemIndex) as string;
							const mailAccountId = this.getNodeParameter('mail_account_id', itemIndex) as string;
							const toEmail = this.getNodeParameter('to_email', itemIndex) as string;
							const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
							const body = buildEmailSendPayload({ templateId, mailAccountId, toEmail, additionalFields });
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/emails/submit'),
								body,
							});
							break;
						}
						case 'templateList': {
							const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.page) qs.page = options.page;
							if (options.per_page) qs.per_page = options.per_page;
							if (options.include_content) {
								qs.include = ['content'];
							}
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl('/email/templates'),
								qs,
							});
							break;
						}
						case 'templateShow': {
							const templateId = this.getNodeParameter('templateId', itemIndex) as string;
							const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.include_content) {
								qs.include = ['content'];
							}
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl(`/email/templates/${templateId}`),
								qs,
							});
							break;
						}
						case 'templateCreate': {
							const name = this.getNodeParameter('name', itemIndex) as string;
							const content = this.getNodeParameter('content', itemIndex) as string;
							const contentType = this.getNodeParameter('content_type', itemIndex) as string;
							const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
							const body = buildTemplateCreatePayload({ name, content, contentType, additionalFields });
							responseData = await requestFalconyte.call(this, {
								method: 'POST',
								url: buildUrl('/email/templates'),
								body,
							});
							break;
						}
						case 'templateDelete': {
							const templateId = this.getNodeParameter('templateId', itemIndex) as string;
							responseData = await requestFalconyte.call(this, {
								method: 'DELETE',
								url: buildUrl(`/email/templates/${templateId}`),
							});
							break;
						}
						case 'mailAccountList': {
							responseData = await requestFalconyte.call(this, {
								method: 'GET',
								url: buildUrl('/email/mail-accounts'),
							});
							break;
						}
						default:
							throw new Error(`Unsupported operation: ${operation}`);
					}
				} else {
					throw new Error(`Unsupported resource: ${resource}`);
				}

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

