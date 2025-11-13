# Falconyte n8n Node Documentation

## Overview

Falconyte empowers teams to automate marketing journeys and consolidate engagement data. This package now ships both an action node and a trigger:

- `Falconyte` action node: manage contacts, ingest events, control webhook lifecycles, and audit deliveries.
- `Falconyte Trigger` node: automatically register Falconyte webhooks and stream authenticated events into n8n workflows.

All requests authenticate with your Falconyte API key (header `x-api-key`) and identify themselves via the `Falconyte-n8n/1.0` user agent.

## Credentials

1. In n8n, create credentials of type **Falconyte API**.
2. Provide the API Key generated in the Falconyte dashboard.
3. Optional: override the base URL (defaults to `https://api.falconyte.com`) for staging or regional environments.
4. Use the built-in connection test (GET `/public/v1/ping`) to confirm connectivity and permissions.

## Action Node Operations

All endpoints use the public API namespace (`/public/v1`).

### Contact: Upsert

- **Endpoint**: `POST /public/v1/email/contacts/upsert`
- **Required**: `email`
- **Optional**: profile fields (`first_name`, `last_name`, `phone`, `foreign_id`, `country_code`), custom fields (`custom_str_*`, `custom_int_*`, `custom_dec_*`, `custom_datetime_*`, `custom_bool_*`), `custom_fields` (JSON object), `tags` (JSON array)
- **Response**: Returns the created/updated contact payload.

### Contact: Bulk Upsert

- **Endpoint**: `POST /public/v1/email/contacts/bulk-upsert`
- Provide a JSON array of contact objects via the **Contacts** field.
- Optional root-level `tags` (JSON array) applies to every contact.
- Validates a maximum of 1,000 contacts per call.

### Event: Submit / Inspect

- **Submit Event**: `POST /public/v1/email/events`
  - **Required**: `event_name` (`contact.saved`, `contact.unsubscribed`, `lead.created`, `sale.created`)
  - Provide either `email` or `idempotency_key`.
  - Optional `occurred_at` (`Y-m-d H:i:s`) and `payload` (JSON).
- **Get Event**: `GET /public/v1/email/events/{event_id}`
- **Get Decisions**: `GET /public/v1/email/events/{event_id}/decisions`

### Unsubscribe Management

- **Single Unsubscribe**: `POST /public/v1/email/contacts/unsubscribe` (requires `email`, optional `reason`)
- **Bulk Unsubscribe**: `POST /public/v1/email/contacts/bulk-unsubscribe`
  - Accepts a JSON array of email strings and optional `reason`.
- **List Unsubscribes**: `GET /public/v1/email/contacts/unsubscribes`
  - Supports `page`, `per_page`, and `search`.

### Webhook Lifecycle

- **List Webhooks**: `GET /public/v1/webhooks`
- **Get Webhook**: `GET /public/v1/webhooks/{webhookId}`
- **Create Webhook**: `POST /public/v1/webhooks`
  - Required `url` and at least one event; optional `is_enabled`.
- **Delete Webhook**: `DELETE /public/v1/webhooks/{webhookId}`
- **Update Webhook**: `PATCH /public/v1/webhooks/{webhookId}`
  - Update `url`, subscribed `events`, and `is_enabled` without rotating the secret.
- **Enable / Disable**: `POST /public/v1/webhooks/{webhookId}/enable` or `/disable`
- **List Deliveries**: `GET /public/v1/webhooks/{webhookId}/deliveries`
  - Accepts optional `query`, `columns`, and pagination parameters.
- **Simulate Event**: `POST /public/v1/webhooks/simulate`
  - Generates a sample payload for a selected event.

## Trigger Node

`Falconyte Trigger` automatically provisions and tears down webhooks for you:

- Select one or more events to subscribe to (uses the same event list as the action node).
- During activation, the node ensures a Falconyte webhook exists (creating or updating as needed) and stores the returned secret.
- Incoming requests are HMAC validated (`X-FY-Signature`). Invalid signatures return `403` and do not trigger workflows.
- Payloads include the original webhook JSON plus a `metadata` object with the webhook ID and signature timestamp.
- Webhooks created by the trigger include `"source": "n8n"`, so they appear in Falconyte with a managed badge and remain read-only in the dashboard.

Reactivating the trigger replaces any existing subscription with the latest configuration.

## Error Handling

- 401/403 responses bubble up with actionable error messages (check API key or permissions).
- 422 validation errors surface detailed Falconyte validation feedback.
- Network or 5xx errors include Falconyte error codes when present.
- Trigger requests respond with HTTP 403 when signature verification fails.

## Sample Payloads

### Contact Upsert (Full)

```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "foreign_id": "ext-123",
  "country_code": "US",
  "custom_fields": {
    "custom_int_1": 42,
    "custom_bool_1": true
  },
  "tags": ["vip", "newsletter"]
}
```

### Event Submit

```json
{
  "event_name": "contact.saved",
  "occurred_at": "2024-01-15 14:30:00",
  "email": "user@example.com",
  "payload": {
    "foreign_id": "ext-123",
    "first_name": "Ada",
    "last_name": "Lovelace"
  }
}
```

### Bulk Unsubscribe

```json
{
  "emails": [
    "optout1@example.com",
    "contact-002@example.com"
  ],
  "reason": "user_request"
}
```

### Webhook Create

```json
{
  "url": "https://example.com/webhooks/falconyte",
  "events": ["email.sent", "email.opened"],
  "is_enabled": true,
  "source": "n8n"
}
```

### Webhook Deliveries Query Filters

```json
{
  "query": {
    "condition": "AND",
    "type": "builder",
    "rules": [
      {
        "column": "status",
        "operator": "equals",
        "value": "failed"
      }
    ]
  },
  "columns": ["status", "response_code", "attempts"]
}
```

## Example Workflows

- `examples/falconyte-basic-workflow.json`: Upsert contact → submit event → unsubscribe contact.
- Pair the action workflow with the trigger node to drive reactive automations from live Falconyte activity.

## Development & Testing

```bash
npm install
npm run lint
npm test
npm run build
```

For iterative development use:

```bash
npm run watch
```

## Publishing

Follow the [n8n publishing guide](https://docs.n8n.io/integrations/community-nodes/publish/):

1. Ensure `package.json` metadata is correct (name, version, keywords, repository).
2. Confirm compiled assets in `dist` are up to date (`npm run build`).
3. Provide changelog notes and bump semantic version.
4. Submit the package to npm and create a pull request in the `n8n-nodes` community repository.

