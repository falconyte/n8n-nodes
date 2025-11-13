import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const webhookEventOptions: INodePropertyOptions[] = [
	{
		name: 'Email Queued',
		value: 'email.queued',
		description: 'To get notified when an email is queued for delivery',
	},
	{
		name: 'Email Sent',
		value: 'email.sent',
		description: 'To get notified when an email is successfully sent',
	},
	{
		name: 'Email Soft Bounced',
		value: 'email.bounced.soft',
		description: 'To get notified when an email soft bounces (temporary delivery failure)',
	},
	{
		name: 'Email Hard Bounced',
		value: 'email.bounced.hard',
		description: 'To get notified when an email hard bounces (permanent delivery failure)',
	},
	{
		name: 'Email Deferred',
		value: 'email.deferred',
		description: 'To get notified when email delivery is deferred (temporarily delayed)',
	},
	{
		name: 'Email Opened',
		value: 'email.opened',
		description: 'To get notified when a recipient opens an email',
	},
	{
		name: 'Email Clicked',
		value: 'email.clicked',
		description: 'To get notified when a recipient clicks a link in an email',
	},
	{
		name: 'Email Bot Opened',
		value: 'email.bot.opened',
		description: 'To get notified when an email open is detected as a bot',
	},
	{
		name: 'Email Bot Clicked',
		value: 'email.bot.clicked',
		description: 'To get notified when an email click is detected as a bot',
	},
	{
		name: 'Email Replied',
		value: 'email.replied',
		description: 'To get notified when a recipient replies to an email',
	},
	{
		name: 'Contact Saved',
		value: 'email.contact.saved',
		description: 'To get notified when a contact is created or updated',
	},
	{
		name: 'Contact Unsubscribed',
		value: 'email.contact.unsubscribed',
		description: 'To get notified when a contact unsubscribes from emails',
	},
	{
		name: 'Lead Created',
		value: 'email.lead.created',
		description: 'To get notified when a lead is created from email activity',
	},
	{
		name: 'Sale Created',
		value: 'email.sale.created',
		description: 'To get notified when a sale is created from email activity',
	},
];

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List webhooks',
				description: 'Retrieve all configured webhooks',
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create webhook',
				description: 'Create a new webhook subscription',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete webhook',
				description: 'Delete a webhook by ID',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get webhook',
				description: 'Retrieve a webhook by ID',
			},
			{
				name: 'Enable',
				value: 'enable',
				action: 'Enable webhook',
				description: 'Enable deliveries for a webhook',
			},
			{
				name: 'Disable',
				value: 'disable',
				action: 'Disable webhook',
				description: 'Disable deliveries for a webhook',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update webhook',
				description: 'Update webhook URL, events, or enabled status',
			},
			{
				name: 'List Deliveries',
				value: 'listDeliveries',
				action: 'List webhook deliveries',
				description: 'Retrieve recent delivery attempts for a webhook',
			},
			{
				name: 'Simulate Event',
				value: 'simulate',
				action: 'Simulate webhook event',
				description: 'Generate a sample payload for a webhook event',
			},
		],
		default: 'list',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['delete', 'enable', 'disable', 'listDeliveries', 'get', 'update'],
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
				resource: ['webhook'],
				operation: ['create'],
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
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: webhookEventOptions,
		description: 'Event types to subscribe to',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
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
	{
		displayName: 'Pagination',
		name: 'pagination',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['list', 'listDeliveries'],
			},
		},
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Page number to request',
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 20,
				description: 'Number of records per page',
			},
		],
	},
	{
		displayName: 'Filters (JSON)',
		name: 'filters',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['listDeliveries'],
			},
		},
		description:
			'Optional filters JSON object. Supports Falconyte delivery query builder and columns arrays.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['update'],
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
				resource: ['webhook'],
				operation: ['simulate'],
			},
		},
		options: webhookEventOptions,
		description: 'Event type to simulate',
	},
];

