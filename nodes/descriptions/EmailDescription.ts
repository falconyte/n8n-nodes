import type { INodeProperties } from 'n8n-workflow';
import { webhookEventOptions } from './WebhookDescription';

export const emailOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['email'],
			},
		},
		options: [
			// Contacts
			{
				name: 'Upsert Contact',
				value: 'contactUpsert',
				action: 'Upsert contact',
				description: 'Create or update a single contact',
			},
			{
				name: 'Bulk Upsert Contacts',
				value: 'contactBulkUpsert',
				action: 'Bulk upsert contacts',
				description: 'Create or update multiple contacts',
			},
			// Campaigns
			{
				name: 'List Campaigns',
				value: 'campaignList',
				action: 'List campaigns',
				description: 'Retrieve event-triggered email campaigns with pagination',
			},
			{
				name: 'Create Campaign',
				value: 'campaignCreate',
				action: 'Create campaign',
				description: 'Create a new event-triggered campaign',
			},
			{
				name: 'Submit Campaign Event',
				value: 'campaignSubmit',
				action: 'Submit campaign event',
				description: 'Submit an event to trigger a specific campaign',
			},
			{
				name: 'Start Campaign',
				value: 'campaignStart',
				action: 'Start campaign',
				description: 'Start or resume an event-triggered campaign',
			},
			{
				name: 'Stop Campaign',
				value: 'campaignStop',
				action: 'Stop campaign',
				description: 'Stop an active event-triggered campaign',
			},
			// Emails
			{
				name: 'Send Email',
				value: 'emailSend',
				action: 'Send email',
				description: 'Send a transactional email using a template',
			},
			// Templates
			{
				name: 'List Templates',
				value: 'templateList',
				action: 'List templates',
				description: 'Retrieve all private templates with pagination',
			},
			{
				name: 'Get Template',
				value: 'templateShow',
				action: 'Get template',
				description: 'Retrieve a single template by ID',
			},
			{
				name: 'Create Template',
				value: 'templateCreate',
				action: 'Create template',
				description: 'Create a new HTML template',
			},
			{
				name: 'Delete Template',
				value: 'templateDelete',
				action: 'Delete template',
				description: 'Delete a template by ID',
			},
			// Mail Accounts
			{
				name: 'List Mail Accounts',
				value: 'mailAccountList',
				action: 'List mail accounts',
				description: 'Retrieve all active mail accounts',
			},
			// Events
			{
				name: 'Submit Event',
				value: 'eventSubmit',
				action: 'Submit event',
				description: 'Submit an event to Falconyte',
			},
			{
				name: 'Get Event',
				value: 'eventGet',
				action: 'Get event',
				description: 'Retrieve an ingested event by ID',
			},
			{
				name: 'Get Event Decisions',
				value: 'eventGetDecisions',
				action: 'Get event decisions',
				description: 'Fetch campaign decisions for an ingested event',
			},
			// Unsubscribes
			{
				name: 'Unsubscribe Contact',
				value: 'unsubscribeContact',
				action: 'Unsubscribe contact',
				description: 'Mark a single contact as unsubscribed',
			},
			{
				name: 'Bulk Unsubscribe Contacts',
				value: 'unsubscribeBulk',
				action: 'Bulk unsubscribe contacts',
				description: 'Unsubscribe multiple contacts',
			},
			{
				name: 'List Unsubscribes',
				value: 'unsubscribeList',
				action: 'List unsubscribed contacts',
				description: 'Retrieve unsubscribed contacts with pagination',
			},
			// Webhooks
			{
				name: 'List Webhooks',
				value: 'webhookList',
				action: 'List webhooks',
				description: 'Retrieve all configured webhooks',
			},
			{
				name: 'Create Webhook',
				value: 'webhookCreate',
				action: 'Create webhook',
				description: 'Create a new webhook subscription',
			},
			{
				name: 'Delete Webhook',
				value: 'webhookDelete',
				action: 'Delete webhook',
				description: 'Delete a webhook by ID',
			},
			{
				name: 'Get Webhook',
				value: 'webhookGet',
				action: 'Get webhook',
				description: 'Retrieve a webhook by ID',
			},
			{
				name: 'Enable Webhook',
				value: 'webhookEnable',
				action: 'Enable webhook',
				description: 'Enable deliveries for a webhook',
			},
			{
				name: 'Disable Webhook',
				value: 'webhookDisable',
				action: 'Disable webhook',
				description: 'Disable deliveries for a webhook',
			},
			{
				name: 'Update Webhook',
				value: 'webhookUpdate',
				action: 'Update webhook',
				description: 'Update webhook URL, events, or enabled status',
			},
			{
				name: 'List Webhook Deliveries',
				value: 'webhookListDeliveries',
				action: 'List webhook deliveries',
				description: 'Retrieve recent delivery attempts for a webhook',
			},
			{
				name: 'Simulate Webhook Event',
				value: 'webhookSimulate',
				action: 'Simulate webhook event',
				description: 'Generate a sample payload for a webhook event',
			},
		],
		default: 'contactUpsert',
	},
];

export const emailFields: INodeProperties[] = [
	// Contact Upsert
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['contactUpsert', 'unsubscribeContact'],
			},
		},
		description: 'Email address of the contact',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['contactUpsert', 'webhookCreate'],
			},
		},
		default: {},
		options: [
			// Contact fields
			{
				displayName: 'Country Code',
				name: 'country_code',
				type: 'string',
				default: '',
				description: 'Two-letter ISO country code',
			},
			{ displayName: 'Custom Bool 1', name: 'custom_bool_1', type: 'boolean', default: false },
			{ displayName: 'Custom Bool 2', name: 'custom_bool_2', type: 'boolean', default: false },
			{ displayName: 'Custom Bool 3', name: 'custom_bool_3', type: 'boolean', default: false },
			{
				displayName: 'Custom Date 1',
				name: 'custom_datetime_1',
				type: 'string',
				default: '',
				description: 'Date in YYYY-MM-DD format',
			},
			{
				displayName: 'Custom Date 2',
				name: 'custom_datetime_2',
				type: 'string',
				default: '',
				description: 'Date in YYYY-MM-DD format',
			},
			{
				displayName: 'Custom Date 3',
				name: 'custom_datetime_3',
				type: 'string',
				default: '',
				description: 'Date in YYYY-MM-DD format',
			},
			{ displayName: 'Custom Decimal 1', name: 'custom_dec_1', type: 'number', default: 0 },
			{ displayName: 'Custom Decimal 2', name: 'custom_dec_2', type: 'number', default: 0 },
			{ displayName: 'Custom Decimal 3', name: 'custom_dec_3', type: 'number', default: 0 },
			{
				displayName: 'Custom Fields (JSON)',
				name: 'custom_fields',
				type: 'json',
				default: '',
				description: 'JSON object of custom fields to attach to the contact',
			},
			{ displayName: 'Custom Integer 1', name: 'custom_int_1', type: 'number', default: 0 },
			{ displayName: 'Custom Integer 2', name: 'custom_int_2', type: 'number', default: 0 },
			{ displayName: 'Custom Integer 3', name: 'custom_int_3', type: 'number', default: 0 },
			{ displayName: 'Custom Integer 4', name: 'custom_int_4', type: 'number', default: 0 },
			{ displayName: 'Custom Integer 5', name: 'custom_int_5', type: 'number', default: 0 },
			{ displayName: 'Custom String 1', name: 'custom_str_1', type: 'string', default: '' },
			{ displayName: 'Custom String 2', name: 'custom_str_2', type: 'string', default: '' },
			{ displayName: 'Custom String 3', name: 'custom_str_3', type: 'string', default: '' },
			{ displayName: 'Custom String 4', name: 'custom_str_4', type: 'string', default: '' },
			{ displayName: 'Custom String 5', name: 'custom_str_5', type: 'string', default: '' },
			{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
			{
				displayName: 'Foreign ID',
				name: 'foreign_id',
				type: 'string',
				default: '',
				description: 'External identifier for the contact',
			},
			{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
			{
				displayName: 'Tags (JSON)',
				name: 'tags',
				type: 'json',
				default: '',
				description: 'JSON array of tags to apply to the contact',
			},
			// Webhook create additional fields
			{
				displayName: 'Enabled',
				name: 'is_enabled',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook should start enabled',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Optional description to store with the webhook',
			},
		],
	},
	// Contact Bulk Upsert
	{
		displayName: 'Contacts',
		name: 'contacts',
		type: 'json',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['contactBulkUpsert'],
			},
		},
		description:
			'Array of contacts to upsert. Use an expression to reference items or provide JSON directly.',
	},
	{
		displayName: 'Tags (JSON)',
		name: 'tags',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['contactBulkUpsert'],
			},
		},
		description: 'Optional JSON array of tags to apply to every contact in the request.',
	},
	// Events
	{
		displayName: 'Event Name',
		name: 'event_name',
		type: 'options',
		required: true,
		default: 'contact.saved',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['eventSubmit'],
			},
		},
		options: [
			{ name: 'contact.saved', value: 'contact.saved' },
			{ name: 'contact.unsubscribed', value: 'contact.unsubscribed' },
			{ name: 'lead.created', value: 'lead.created' },
			{ name: 'sale.created', value: 'sale.created' },
		],
		description: 'Type of event to submit',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: false,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['eventSubmit'],
			},
		},
		description: 'Email associated with the event',
	},
	{
		displayName: 'Idempotency Key',
		name: 'idempotency_key',
		type: 'string',
		required: false,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['eventSubmit'],
			},
		},
		description: 'Unique identifier for deduplicating events',
	},
	{
		displayName: 'Occurred At',
		name: 'occurred_at',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['eventSubmit'],
			},
		},
		description: 'Timestamp of when the event occurred. Defaults to now if not provided.',
	},
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['eventSubmit'],
			},
		},
		description: 'Additional payload data for the event as JSON',
	},
	{
		displayName: 'Event ID',
		name: 'eventId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['eventGet', 'eventGetDecisions'],
			},
		},
		description: 'UUID of the ingested event.',
	},
	// Unsubscribes
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['unsubscribeContact'],
			},
		},
		description: 'Optional reason for the unsubscribe action',
	},
	{
		displayName: 'Emails',
		name: 'emails',
		type: 'json',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['unsubscribeBulk'],
			},
		},
		description: 'JSON array of email addresses to unsubscribe.',
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['unsubscribeBulk'],
			},
		},
		description: 'Optional reason applied to each unsubscribe entry.',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		default: {},
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['unsubscribeList', 'webhookListDeliveries'],
			},
		},
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 50,
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Optional search string to filter by email.',
			},
		],
	},
	// Webhooks
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['webhookDelete', 'webhookEnable', 'webhookDisable', 'webhookListDeliveries', 'webhookGet', 'webhookUpdate'],
			},
		},
		description: 'Unique identifier of the webhook',
	},
	{
		displayName: 'Webhook URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['webhookCreate'],
			},
		},
		description: 'Public URL that will receive Falconyte webhook deliveries',
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		required: true,
		default: [],
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['webhookCreate'],
			},
		},
		options: webhookEventOptions,
		description: 'Event types to subscribe to',
	},
	{
		displayName: 'Pagination',
		name: 'pagination',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['webhookList', 'webhookListDeliveries'],
			},
		},
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
				description: 'Page number to request',
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 20,
				description: 'Number of records per page',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['webhookUpdate'],
			},
		},
		options: [
			{
				displayName: 'Webhook URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'New URL that will receive Falconyte webhook deliveries',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				default: [],
				options: webhookEventOptions,
				description: 'Event types to subscribe to',
			},
			{
				displayName: 'Enabled',
				name: 'is_enabled',
				type: 'boolean',
				default: true,
				description: 'Enable or disable the webhook',
			},
		],
	},
	{
		displayName: 'Event',
		name: 'event',
		type: 'options',
		required: true,
		default: 'email.sent',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['webhookSimulate'],
			},
		},
		options: webhookEventOptions,
		description: 'Event type to simulate',
	},
	// Campaigns
	{
		displayName: 'Campaign ID',
		name: 'campaignId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignSubmit', 'campaignStart', 'campaignStop'],
			},
		},
		description: 'UUID of the campaign',
	},
	{
		displayName: 'Campaign Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignCreate'],
			},
		},
		description: 'Name of the campaign',
	},
	{
		displayName: 'Template IDs',
		name: 'template_ids',
		type: 'json',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignCreate'],
			},
		},
		description: 'JSON array of template UUIDs to use in rotation',
	},
	{
		displayName: 'Mail Account IDs',
		name: 'mail_account_ids',
		type: 'json',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignCreate'],
			},
		},
		description: 'JSON array of mail account UUIDs to use for sending',
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		required: true,
		default: [],
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignCreate'],
			},
		},
		options: [
			{ name: 'contact.saved', value: 'contact.saved' },
			{ name: 'lead.created', value: 'lead.created' },
			{ name: 'sale.created', value: 'sale.created' },
		],
		description: 'Event names that trigger this campaign',
	},
	{
		displayName: 'Event Name',
		name: 'event_name',
		type: 'options',
		required: true,
		default: 'contact.saved',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignSubmit'],
			},
		},
		options: [
			{ name: 'contact.saved', value: 'contact.saved' },
			{ name: 'contact.unsubscribed', value: 'contact.unsubscribed' },
			{ name: 'lead.created', value: 'lead.created' },
			{ name: 'sale.created', value: 'sale.created' },
		],
		description: 'Event name that triggers the campaign',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: false,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignSubmit'],
			},
		},
		description: 'Email address of the contact (required if idempotency_key not provided)',
	},
	{
		displayName: 'Idempotency Key',
		name: 'idempotency_key',
		type: 'string',
		required: false,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignSubmit'],
			},
		},
		description: 'Unique identifier for the event (required if email not provided)',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		default: {},
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['campaignList'],
			},
		},
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Search term to filter campaigns by name',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 15,
				description: 'Number of items per page',
			},
		],
	},
	// Emails
	{
		displayName: 'Template',
		name: 'template_id',
		type: 'options',
		required: true,
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
		},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['emailSend'],
			},
		},
		description: 'Select an email template to use. Templates can be created in Falconyte or via the Create Template operation.',
	},
	{
		displayName: 'Mail Account',
		name: 'mail_account_id',
		type: 'options',
		required: true,
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getMailAccounts',
		},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['emailSend'],
			},
		},
		description: 'Select a mail account to send from. Mail accounts must be configured in Falconyte first.',
	},
	{
		displayName: 'To Email',
		name: 'to_email',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['emailSend'],
			},
		},
		description: 'Email address of the recipient',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['emailSend'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'To Name',
				name: 'to_name',
				type: 'string',
				default: '',
				description: 'Name of the recipient',
			},
			{
				displayName: 'From Name',
				name: 'from_name',
				type: 'string',
				default: '',
				description: 'Custom from name to override the mail account default',
			},
			{
				displayName: 'Contact ID',
				name: 'contact_id',
				type: 'string',
				default: '',
				description: 'UUID of existing contact (optional)',
			},
			{
				displayName: 'Variables (JSON)',
				name: 'variables',
				type: 'json',
				default: '',
				description: 'JSON object of variables to use in template rendering',
			},
		],
	},
	// Templates
	{
		displayName: 'Template ID',
		name: 'templateId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['templateShow', 'templateDelete'],
			},
		},
		description: 'UUID of the template',
	},
	{
		displayName: 'Template Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['templateCreate'],
			},
		},
		description: 'Name of the template',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['templateCreate'],
			},
		},
		description: 'HTML content of the template',
	},
	{
		displayName: 'Content Type',
		name: 'content_type',
		type: 'options',
		required: true,
		default: 'html',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['templateCreate'],
			},
		},
		options: [
			{ name: 'HTML', value: 'html' },
		],
		description: 'Content type of the template',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['templateCreate'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'Subject line for emails using this template',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['templateList', 'templateShow'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Content',
				name: 'include_content',
				type: 'boolean',
				default: false,
				description: 'Whether to include the full template content in the response',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 15,
				description: 'Number of items per page',
			},
		],
	},
];


