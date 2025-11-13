import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FalconyteApi implements ICredentialType {
	name = 'falconyteApi';

	displayName = 'Falconyte API';

	documentationUrl = 'https://docs.falconyte.dev/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description: 'Your Falconyte API key from the Falconyte dashboard',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.falconyte.com',
			required: true,
			description:
				'The Falconyte API base URL. Override only when using a custom environment.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
				'User-Agent': 'Falconyte-n8n/1.0',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			method: 'GET',
			url: '/public/v1/ping',
		},
	};
}

