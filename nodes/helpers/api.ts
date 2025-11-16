import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export type FalconyteContext = IExecuteFunctions | IHookFunctions | IWebhookFunctions | ILoadOptionsFunctions;

function resolveBaseUrl(credentialsBaseUrl?: string): string {
	const raw = (credentialsBaseUrl ?? 'https://api.falconyte.com/v1').replace(/\/$/, '');
	return raw.replace(/\/v1$/i, '') || raw;
}

export async function falconyteRequest(
	this: FalconyteContext,
	options: {
		method: IHttpRequestMethods | 'PATCH' | 'DELETE';
		url: string;
		body?: IDataObject;
		qs?: IDataObject;
	},
) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const credentials = await this.getCredentials('falconyteApi');
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const baseURL = resolveBaseUrl(credentials?.baseUrl as string | undefined);

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return await this.helpers.httpRequestWithAuthentication.call(this, 'falconyteApi', {
			method: options.method,
			url: options.url,
			body: options.body,
			qs: options.qs,
			baseURL,
			json: true,
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}


