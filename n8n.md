🧠 Context

Falconyte is a marketing automation platform that provides APIs for:
•	Creating and managing contacts
•	Submitting lifecycle events (like contact.saved, lead.created, sale.created)
•	Handling unsubscribes
•	Sending webhooks for outbound automation

We already have:
•	Public REST API endpoints (with API key authentication)
•	Webhooks system (HMAC signed)
•	Email/event ingestion endpoints
•	Teams and users model (multi-tenant)

Now we want to create an official n8n Community Node so users can integrate Falconyte easily into their automations — without writing custom HTTP requests.


⸻

🎯 Goal

Develop a production-ready n8n Community Node (@n8n-nodes/falconyte) that allows users to:
1.	Authenticate using their Falconyte API Key
•	Users manually create an API key in Falconyte Dashboard.
•	They paste the key into n8n credentials form.
•	All node requests send this key in the `x-api-key: {API_KEY}` header.
2.	Use Falconyte actions and triggers
•	Actions for sending data (contacts, events, unsubscribes).
•	Triggers for receiving webhook notifications (optional, later phase).
3.	Support basic operations immediately (minimal viable node):
•	Contact Upsert (single contact)
•	Contact Bulk Upsert
•	Unsubscribe Contact
•	Submit Event
•	Optional: Test API connection
4.	Make the node available in n8n’s community store for public use.

⸻

⚙️ API Summary

Base URL (example):
https://api.falconyte.com/v1

Endpoints

Purpose
Method
Path
Description
Upsert contact
POST
/contacts
Create or update a single contact
Bulk upsert contacts
POST
/contacts/bulk
Create/update multiple contacts
Unsubscribe contact
POST
/contacts/unsubscribe
Mark contact unsubscribed
Bulk unsubscribe
POST
/contacts/unsubscribe/bulk
Unsubscribe multiple
Submit event
POST
/events
Submit any event (e.g., lead.created, sale.created)

Headers

x-api-key: <API_KEY>
Content-Type: application/json
User-Agent: Falconyte-n8n/1.0

Example JSON Payloads

Contact upsert (minimal)

```
{
  "email": "user@example.com"
}
```

Contact upsert (full)

```
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
  }
}
```

Event ingest

```
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

🧩 Node Design

Node name: Falconyte

Display name: Falconyte (Email & Events)

Description

Integrate Falconyte with your n8n workflows — manage contacts, submit events, and automate your marketing operations.

Categories

["Marketing", "CRM", "Email"]

Node group

resourceOperation structure:
•	Resource: Contact, Event, Unsubscribe
•	Operations:
•	For Contact: upsert, bulkUpsert
•	For Event: submit
•	For Unsubscribe: single, bulk


🔐 Authentication

Type: API Key
Name: falconyteApi
Fields:
•	apiKey (string, required)
•	baseUrl (optional, default: https://api.falconyte.com/v1)

Test method:
Send GET /ping or small POST /events test to verify connection.


In code:

```
{
  name: 'apiKey',
  type: 'string',
  default: '',
  required: true,
  description: 'Your Falconyte API key',
}
```

Attach to header:
```
headers: {
  'x-api-key': credentials.apiKey,
}
```

📨 Ingest Events API

- Endpoint: `POST /email/events`
  - Required body schema (validated server-side via `IngestEventData`):
    - `event_name` (enum): `contact.saved | contact.unsubscribed | lead.created | sale.created`
    - One of `email` (valid email) or `idempotency_key` (UUID) must be provided
    - Optional: `occurred_at` (`Y-m-d H:i:s`), `payload` (object)
  - Success (202): `{ "ok": true, "event_id": "<uuid>" }`
  - Failure paths:
    - 422 for validation (missing fields, bad email/enum)
    - 500 returns `{ ok: false, event_id?, error: { code: "INTERNAL_SERVER_ERROR", message: ... } }`
  - Downstream: request is converted into `DomainEvent`, dispatched through `EventDispatcher`, deduped, logged to ClickHouse (`ingest_event_logs`)
- Endpoint: `GET /email/events/{event_id}`
  - Returns the stored event (`IngestEventResource`) including `payload`, `duplicate_of`, `failure_reason`, timestamps.
- Endpoint: `GET /email/events/{event_id}/decisions`
  - Uses segmentation service to return campaign decisions triggered by that event.
- n8n node considerations:
  - Default `occurred_at` can be omitted (server stores current time).
  - Provide optional idempotency field in UI with guidance for `lead.created` / `sale.created` to match tracking IDs.
  - Surface structured error messages (422, 404, 500) to users.

🌐 Webhook API

- Management endpoints (`/webhooks`, requires API key auth):
  - `GET /webhooks`: paginated list of team webhooks.
  - `POST /webhooks`: create webhook with body `{ url, events[], is_enabled? }`.
  - `DELETE /webhooks/{webhookId}`.
  - `POST /webhooks/{webhookId}/enable` and `/disable` to toggle delivery.
  - `GET /webhooks/{webhookId}/deliveries`: paginated delivery history (ClickHouse-backed). Accepts optional filter builder (`query`) and `columns` array.
  - `POST /webhooks/simulate`: returns sample payload for a given event.
- Supported events (from `WebhookEventEnum`):
  - `email.queued`, `email.sent`, `email.bounced.soft`, `email.bounced.hard`, `email.deferred`, `email.opened`, `email.clicked`, `email.bot.opened`, `email.bot.clicked`, `email.replied`, `email.contact.saved`, `email.contact.unsubscribed`, `email.lead.created`, `email.sale.created`
- Delivery mechanics (`DispatchWebhookJob` + `WebhookDispatcher`):
  - Only enabled webhooks subscribed to the event receive payloads.
  - Payload structure:

```
{
  "id": "<uuid>",
  "event": "email.sent",
  "team_id": "<team-uuid>",
  "timestamp": "2024-03-01T12:00:00Z",
  "payload": { ...event-specific fields... }
}
```

  - Headers include:
    - `X-FY-Signature: t=<unix>, v1=<HMAC_SHA256(secret, "t.body")>`
    - `X-FY-Origin: webhook`
    - `User-Agent: Falconyte/1.0`
  - Retries: exponential backoff up to 7 tries; logs delivery status (`success`, `pending`, `failed`) to `team_webhook_deliveries`.
  - Rate limiting (429) and auth failures (401/403) are handled with retries/terminal failure.
- n8n trigger guidance:
  - For phase 2, expose credential field to capture webhook secret returned on creation (encrypted at rest).
  - Verification requires recreating HMAC using received body and timestamp.
  - Provide webhook simulator action for developer testing.

🧰 Required Files & Structure

```
n8n-nodes-falconyte/
├── package.json
├── nodes/
│   ├── Falconyte.node.ts
│   ├── FalconyteApi.credentials.ts
│   └── descriptions/
│       ├── ContactDescription.ts
│       ├── EventDescription.ts
│       └── UnsubscribeDescription.ts
└── credentials/
    └── FalconyteApi.credentials.ts
```

🧠 Development Notes
•	Use the n8n node CLI￼ (n8n-node-dev new).
•	Build using TypeScript + Node.js 18+.
•	Validate all responses.
•	Gracefully handle 401/403 for invalid API keys.
•	Add test data (sample payloads for each operation).
•	Add documentation.md with example workflows.


⸻

🚀 Phase 2 — (Optional Later)

After minimal version works:
•	Add webhook trigger node for Falconyte events (signed via HMAC).
•	URL: /webhook
•	Verify signature with shared secret.
•	Add more actions:
•	Start/stop campaigns
•	Fetch campaign list
•	Retrieve contact stats

🧾 Deliverables
1.	Fully working n8n node (ready for testing)
2.	Unit tests for each operation
3.	Example workflow .json showing:
•	Create contact → Submit event → Unsubscribe
4.	README.md and docs page explaining setup and authentication
5.	Instructions for publishing to n8n Community Store

🧱 Summary Checklist

Task
Status
Setup Node boilerplate (CLI)
☐
Add credentials schema (API key)
☐
Implement /contacts, /events, /unsubscribe
☐
Add response handling & error reporting
☐
Add unit tests
☐
Add docs and examples
☐
Prepare for npm publish
☐



