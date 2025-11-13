import type { INodeProperties } from 'n8n-workflow';

export const unsubscribeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['unsubscribe'],
			},
		},
		options: [
			{
				name: 'Unsubscribe Contact',
				value: 'single',
				action: 'Unsubscribe contact',
				description: 'Mark a single contact as unsubscribed',
			},
			{
				name: 'Bulk Unsubscribe',
				value: 'bulk',
				action: 'Bulk unsubscribe contacts',
				description: 'Unsubscribe multiple contacts',
			},
			{
				name: 'List Unsubscribes',
				value: 'list',
				action: 'List unsubscribed contacts',
				description: 'Retrieve unsubscribed contacts with pagination',
			},
		],
		default: 'single',
	},
];

export const unsubscribeFields: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: false,
		displayOptions: {
			show: {
				resource: ['unsubscribe'],
				operation: ['single'],
			},
		},
		description: 'Email address of the contact to unsubscribe',
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['unsubscribe'],
				operation: ['single'],
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
				resource: ['unsubscribe'],
				operation: ['bulk'],
			},
		},
		description:
			'JSON array of email addresses to unsubscribe.',
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['unsubscribe'],
				operation: ['bulk'],
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
				resource: ['unsubscribe'],
				operation: ['list'],
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
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
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
];

