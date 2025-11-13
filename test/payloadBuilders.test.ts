import { describe, expect, it } from 'vitest';

import {
	buildContactUpsertPayload,
	buildContactsArray,
	buildBulkUnsubscribePayload,
	buildEventPayload,
	buildUnsubscribeSinglePayload,
	buildWebhookCreatePayload,
	buildWebhookDeliveriesQuery,
} from '../nodes/helpers/payloadBuilders';

describe('payloadBuilders', () => {
	describe('buildContactUpsertPayload', () => {
		it('requires email', () => {
			expect(() => buildContactUpsertPayload('', {})).toThrowError(
				'Email is required to upsert a contact.',
			);
		});

		it('merges additional fields', () => {
			const body = buildContactUpsertPayload('john@example.com', {
				first_name: 'John',
				custom_fields: '{"score":10}',
				tags: '["vip","lead"]',
			});

			expect(body).toEqual({
				email: 'john@example.com',
				first_name: 'John',
				custom_fields: {
					score: 10,
				},
				tags: ['vip', 'lead'],
			});
		});
	});

	describe('buildContactsArray', () => {
		it('parses JSON strings', () => {
			const contacts = buildContactsArray('[{"email":"a@example.com"}]');
			expect(contacts).toEqual([{ email: 'a@example.com' }]);
		});

		it('throws for non-array JSON', () => {
			expect(() => buildContactsArray('{"email":"fail"}')).toThrowError(
				'Contacts payload must be an array.',
			);
		});

		it('throws for empty arrays', () => {
			expect(() => buildContactsArray('[]')).toThrowError(
				'Contacts must be provided as a non-empty array.',
			);
		});

		it('lowercases email addresses', () => {
			const contacts = buildContactsArray('[{"email":"USER@EXAMPLE.COM"}]');
			expect(contacts).toEqual([{ email: 'user@example.com' }]);
		});
	});

	describe('buildEventPayload', () => {
		it('requires event name', () => {
			expect(() =>
				buildEventPayload({
					eventName: '',
				}),
			).toThrowError('Event name is required.');
		});

		it('requires email or idempotency key', () => {
			expect(() =>
				buildEventPayload({
					eventName: 'contact.saved',
				}),
			).toThrowError('Provide either Email or Idempotency Key for submitting an event.');
		});

		it('builds payload with JSON parsing', () => {
			const body = buildEventPayload({
				eventName: 'contact.saved',
				email: 'jane@example.com',
				payload: '{"foo":"bar"}',
			});

			expect(body).toEqual({
				event_name: 'contact.saved',
				email: 'jane@example.com',
				payload: { foo: 'bar' },
			});
		});
	});

	describe('buildUnsubscribeSinglePayload', () => {
		it('requires identifiers', () => {
			expect(() => buildUnsubscribeSinglePayload({ email: '' })).toThrowError(
				'Email is required to unsubscribe a contact.',
			);
		});

		it('creates payload with reason', () => {
			const body = buildUnsubscribeSinglePayload({
				email: 'a@example.com',
				reason: 'manual',
			});

			expect(body).toEqual({
				email: 'a@example.com',
				reason: 'manual',
			});
		});
	});

	describe('buildBulkUnsubscribePayload', () => {
		it('requires non-empty array', () => {
			expect(() => buildBulkUnsubscribePayload('[]')).toThrowError(
				'Provide at least one email to unsubscribe.',
			);
		});

		it('requires string entries', () => {
			expect(() => buildBulkUnsubscribePayload('[123]')).toThrowError(
				'Each email in bulk unsubscribe must be a non-empty string.',
			);
		});

		it('returns lowercase emails', () => {
			expect(buildBulkUnsubscribePayload('["USER@example.com"]')).toEqual({
				emails: ['user@example.com'],
			});
		});
	});

	describe('buildWebhookCreatePayload', () => {
		it('requires URL', () => {
			expect(() => buildWebhookCreatePayload('', ['email.sent'])).toThrowError(
				'Webhook URL is required to create a webhook.',
			);
		});

		it('requires events selection', () => {
			expect(() => buildWebhookCreatePayload('https://example.com', [])).toThrowError(
				'Select at least one event when creating a webhook.',
			);
		});

		it('merges additional fields', () => {
			const payload = buildWebhookCreatePayload('https://example.com', ['email.sent'], {
				is_enabled: false,
			});

			expect(payload).toEqual({
				url: 'https://example.com',
				events: ['email.sent'],
				is_enabled: false,
			});
		});
	});

	describe('buildWebhookDeliveriesQuery', () => {
		it('combines pagination and filters', () => {
			const query = buildWebhookDeliveriesQuery(
				{ page: 2, per_page: 50 },
				'{"query":{"status":"failed"}}',
			);

			expect(query).toEqual({
				page: 2,
				per_page: 50,
				query: {
					status: 'failed',
				},
			});
		});

		it('ignores empty filters', () => {
			const query = buildWebhookDeliveriesQuery({ page: 1 }, '');
			expect(query).toEqual({ page: 1 });
		});
	});
});

