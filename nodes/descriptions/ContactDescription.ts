import type { INodeProperties } from 'n8n-workflow';

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		options: [
			{
				name: 'Upsert',
				value: 'upsert',
				action: 'Upsert contact',
				description: 'Create or update a single contact',
			},
			{
				name: 'Bulk Upsert',
				value: 'bulkUpsert',
				action: 'Bulk upsert contacts',
				description: 'Create or update multiple contacts',
			},
		],
		default: 'upsert',
	},
];

export const contactFields: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['upsert'],
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
				resource: ['contact'],
				operation: ['upsert'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Country Code',
				name: 'country_code',
				type: 'string',
				default: '',
				description: 'Two-letter ISO country code',
			},
			{
				displayName: 'Custom Bool 1',
				name: 'custom_bool_1',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Custom Bool 2',
				name: 'custom_bool_2',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Custom Bool 3',
				name: 'custom_bool_3',
				type: 'boolean',
				default: false,
			},
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
			{
				displayName: 'Custom Decimal 1',
				name: 'custom_dec_1',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Decimal 2',
				name: 'custom_dec_2',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Decimal 3',
				name: 'custom_dec_3',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Fields (JSON)',
				name: 'custom_fields',
				type: 'json',
				default: '',
				description: 'JSON object of custom fields to attach to the contact',
			},
			{
				displayName: 'Custom Integer 1',
				name: 'custom_int_1',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Integer 2',
				name: 'custom_int_2',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Integer 3',
				name: 'custom_int_3',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Integer 4',
				name: 'custom_int_4',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom Integer 5',
				name: 'custom_int_5',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Custom String 1',
				name: 'custom_str_1',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Custom String 2',
				name: 'custom_str_2',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Custom String 3',
				name: 'custom_str_3',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Custom String 4',
				name: 'custom_str_4',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Custom String 5',
				name: 'custom_str_5',
				type: 'string',
				default: '',
			},
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Foreign ID',
				name: 'foreign_id',
				type: 'string',
				default: '',
				description: 'External identifier for the contact',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tags (JSON)',
				name: 'tags',
				type: 'json',
				default: '',
				description: 'JSON array of tags to apply to the contact',
			},
		],
	},
	{
		displayName: 'Contacts',
		name: 'contacts',
		type: 'json',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['bulkUpsert'],
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
				resource: ['contact'],
				operation: ['bulkUpsert'],
			},
		},
		description: 'Optional JSON array of tags to apply to every contact in the request.',
	},
];

