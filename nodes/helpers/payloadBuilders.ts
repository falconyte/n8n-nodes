import { jsonParse } from 'n8n-workflow';
import type { IDataObject } from 'n8n-workflow';

export function buildContactUpsertPayload(
	email: string,
	additionalFields: IDataObject = {},
): IDataObject {
	if (!email) {
		throw new Error('Email is required to upsert a contact.');
	}

	const body: IDataObject = { email: email.toLowerCase() };

	for (const [key, value] of Object.entries(additionalFields)) {
		if (value === '' || value === null || value === undefined) continue;

		if (key === 'custom_fields') {
			body.custom_fields = typeof value === 'string' ? jsonParse(value) : value;
			continue;
		}

		if (key === 'tags') {
			body.tags = typeof value === 'string' ? jsonParse(value) : value;
			continue;
		}

		body[key] = value;
	}

	return body;
}

export function buildContactsArray(rawContacts: string | IDataObject[]): IDataObject[] {
	const parsedContacts =
		typeof rawContacts === 'string'
			? (jsonParse(rawContacts) as IDataObject | IDataObject[])
			: rawContacts;

	if (!parsedContacts || (Array.isArray(parsedContacts) && parsedContacts.length === 0)) {
		throw new Error('Contacts must be provided as a non-empty array.');
	}

	if (!Array.isArray(parsedContacts)) {
		throw new Error('Contacts payload must be an array.');
	}

	return parsedContacts.map((contact) => {
		if (!contact.email) {
			throw new Error('Each contact must include an email.');
		}

		return {
			...contact,
			email: typeof contact.email === 'string' ? contact.email.toLowerCase() : contact.email,
		};
	});
}

export function buildEventPayload(params: {
	eventName: string;
	email?: string;
	idempotencyKey?: string;
	occurredAt?: string;
	payload?: string | IDataObject;
}): IDataObject {
	const { eventName, email, idempotencyKey, occurredAt, payload } = params;

	if (!eventName) {
		throw new Error('Event name is required.');
	}

	if (!email && !idempotencyKey) {
		throw new Error('Provide either Email or Idempotency Key for submitting an event.');
	}

	const body: IDataObject = {
		event_name: eventName,
	};

	if (email) {
		body.email = email;
	}

	if (idempotencyKey) {
		body.idempotency_key = idempotencyKey;
	}

	if (occurredAt) {
		body.occurred_at = occurredAt;
	}

	if (payload) {
		body.payload = typeof payload === 'string' ? jsonParse(payload) : payload;
	}

	return body;
}

export function buildUnsubscribeSinglePayload(params: {
	email: string;
	reason?: string;
}): IDataObject {
	const { email, reason } = params;

	if (!email) {
		throw new Error('Email is required to unsubscribe a contact.');
	}

	const body: IDataObject = {
		email: email.toLowerCase(),
	};

	if (reason) {
		body.reason = reason;
	}

	return body;
}

export function buildBulkUnsubscribePayload(rawEmails: string | IDataObject): IDataObject {
	const parsed =
		typeof rawEmails === 'string'
			? (rawEmails ? jsonParse(rawEmails) : undefined)
			: rawEmails;

	if (!parsed) {
		throw new Error('Provide at least one email to unsubscribe.');
	}

	if (!Array.isArray(parsed)) {
		throw new Error('Emails payload must be an array of strings.');
	}

	const emails = parsed.map((email) => {
		if (typeof email !== 'string' || !email.trim()) {
			throw new Error('Each email in bulk unsubscribe must be a non-empty string.');
		}

		return email.toLowerCase();
	});

	if (emails.length === 0) {
		throw new Error('Provide at least one email to unsubscribe.');
	}

	return { emails };
}

export function buildWebhookCreatePayload(
	url: string,
	events: string[],
	additionalFields: IDataObject = {},
): IDataObject {
	if (!url) {
		throw new Error('Webhook URL is required to create a webhook.');
	}

	if (!events || events.length === 0) {
		throw new Error('Select at least one event when creating a webhook.');
	}

	const body: IDataObject = {
		url,
		events,
	};

	for (const [key, value] of Object.entries(additionalFields)) {
		if (value === '' || value === null || value === undefined) continue;

		body[key] = value;
	}

	return body;
}

export function buildWebhookDeliveriesQuery(
	pagination: IDataObject = {},
	filters: string | IDataObject = '',
): IDataObject {
	const query: IDataObject = {};

	for (const [key, value] of Object.entries(pagination)) {
		if (value === '' || value === null || value === undefined) continue;
		query[key] = value;
	}

	if (filters) {
		const parsedFilters =
			typeof filters === 'string'
				? (filters ? (jsonParse(filters) as IDataObject) : undefined)
				: filters;

		if (parsedFilters && typeof parsedFilters === 'object') {
			for (const [key, value] of Object.entries(parsedFilters)) {
				if (value === '' || value === null || value === undefined) continue;
				query[key] = value;
			}
		}
	}

	return query;
}

