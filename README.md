# Falconyte n8n Community Node

Official n8n community node for [Falconyte](https://falconyte.com) — automate contact management, event ingestion, webhook administration, and unsubscribe flows without writing custom HTTP requests.

## Features

- **Authenticate with API key** using n8n credentials.
- **Upsert contacts** (single or bulk) with optional custom fields.
- **Submit lifecycle events** (`contact.saved`, `contact.unsubscribed`, `lead.created`, `sale.created`).
- **Unsubscribe contacts** individually or in bulk.
- **Manage webhook subscriptions** including creation, enable/disable, delivery history, and event simulation.
- Structured validation and error messages surfaced directly in n8n.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Build the node

```bash
npm run build
```

### 3. Link into a local n8n instance

```bash
npm link
npm link n8n-nodes-falconyte
```

Restart n8n so it detects the new node.

## Authentication

1. In the Falconyte dashboard, create an API key.
2. In n8n, add new credentials of type **Falconyte API**.
3. Paste the API key and (optionally) override the base URL for non-production environments.

Every request from the node automatically includes the `x-api-key` header and Falconyte specific `User-Agent`.

## Node Operations

### Contact

| Operation      | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| Upsert         | Creates or updates a single contact.                            |
| Bulk Upsert    | Creates or updates multiple contacts via JSON array payload.    |

### Event

| Operation | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| Submit    | Submits lifecycle events with optional payload and idempotency handling. |

### Unsubscribe

| Operation        | Description                                               |
| ---------------- | --------------------------------------------------------- |
| Unsubscribe      | Marks a single contact as unsubscribed.                   |
| Bulk Unsubscribe | Unsubscribes multiple contacts provided as a JSON array.  |

### Webhook

| Operation         | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| List              | Retrieves paginated webhook definitions for the authenticated team.        |
| Create            | Creates a new webhook subscription with selected event types.              |
| Delete            | Deletes a webhook using its ID.                                            |
| Enable / Disable  | Toggles a webhook’s delivery status.                                       |
| List Deliveries   | Fetches recent delivery attempts with optional pagination/filter options.  |
| Simulate Event    | Returns a sample payload for any supported webhook event.                  |

## Development

- `npm run build` – compile TypeScript to `dist`.
- `npm run lint` – run ESLint with the n8n shared config.
- `npm test` – execute unit tests (Vitest).
- `npm run watch` – develop interactively with `n8n-node-dev`.

## Example Workflow

Find an end-to-end workflow that upserts a contact, submits an event, and unsubscribes them in `examples/falconyte-basic-workflow.json`.

Import the JSON into n8n to try the node quickly.

## Publishing Checklist

- [ ] Update the version in `package.json`.
- [ ] Run `npm run lint`, `npm test`, and `npm run build`.
- [ ] Verify example workflows and documentation.
- [ ] Follow the [n8n community node publishing guide](https://docs.n8n.io/integrations/community-nodes/publish/) to submit to the store.

## License

MIT © Falconyte

