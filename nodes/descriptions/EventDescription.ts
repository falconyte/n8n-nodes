import type { INodeProperties } from 'n8n-workflow';

export const eventOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['event'],
			},
		},
		options: [
			{
				name: 'Submit',
				value: 'submit',
				action: 'Submit event',
				description: 'Submit an event to Falconyte',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get event',
				description: 'Retrieve an ingested event by ID',
			},
			{
				name: 'Get Decisions',
				value: 'getDecisions',
				action: 'Get event decisions',
				description: 'Fetch campaign decisions for an ingested event',
			},
		],
		default: 'submit',
	},
];

export const eventFields: INodeProperties[] = [
	{
		displayName: 'Event Name',
		name: 'event_name',
		type: 'options',
		required: true,
		default: 'contact.saved',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['submit'],
			},
		},
		options: [
			{
				name: 'contact.saved',
				value: 'contact.saved',
			},
			{
				name: 'contact.unsubscribed',
				value: 'contact.unsubscribed',
			},
			{
				name: 'lead.created',
				value: 'lead.created',
			},
			{
				name: 'sale.created',
				value: 'sale.created',
			},
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
				resource: ['event'],
				operation: ['submit'],
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
				resource: ['event'],
				operation: ['submit'],
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
				resource: ['event'],
				operation: ['submit'],
			},
		},
		description:
			'Timestamp of when the event occurred. Defaults to the current time if not provided.',
	},
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['submit'],
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
				resource: ['event'],
				operation: ['get', 'getDecisions'],
			},
		},
		description: 'UUID of the ingested event.',
	},
];

