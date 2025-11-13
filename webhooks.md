# Webhook Events Documentation

## Overview

Falconyte's webhook system allows you to receive real-time notifications about events that occur in your account. All webhook deliveries are secured with HMAC-SHA256 signatures and include comprehensive event data.

## Authentication & Security

### HMAC Signature

All webhook payloads are signed using HMAC-SHA256. The signature is included in the `X-FY-Signature` header in the following format:

```
X-FY-Signature: t=<unix_timestamp>,v1=<hex_hmac_sha256_signature>
```

**Signature Generation:**
```
signature = hash_hmac('sha256', "${timestamp}.${raw_body}", $secret)
```

Where:
- `timestamp`: Unix timestamp (seconds since epoch)
- `raw_body`: The raw JSON string of the request body
- `secret`: Your webhook's secret (provided only once during webhook creation)

**Headers:**
- `X-FY-Signature`: `t=<timestamp>,v1=<signature>`
- `User-Agent`: `Falconyte/1.0`
- `Content-Type`: `application/json`

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(signature, secret, body, timestamp) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

**Verification Example (PHP):**
```php
function verifyWebhookSignature(string $signature, string $secret, string $body, int $timestamp): bool
{
    $expectedSignature = hash_hmac('sha256', "{$timestamp}.{$body}", $secret);
    return hash_equals($expectedSignature, $signature);
}
```

## Payload Structure

All webhook payloads follow this standard structure:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.sent",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    // Event-specific data
  }
}
```

**Common Fields:**
- `id`: Unique identifier for this webhook delivery (UUID)
- `event`: The event name (see available events below)
- `team_id`: Your team's unique identifier (UUID)
- `timestamp`: ISO 8601 timestamp when the event occurred
- `payload`: Event-specific data (structure varies by event type)

## Delivery & Retry Behavior

### Retry Schedule
Webhooks are retried with exponential backoff if delivery fails (non-2xx response or timeout):
- Attempt 1: Immediate
- Attempt 2: 30 seconds
- Attempt 3: 2 minutes
- Attempt 4: 10 minutes
- Attempt 5: 30 minutes
- Attempt 6: 2 hours
- Attempt 7: 6 hours

After 7 attempts, the delivery is marked as failed.

### Delivery Logs
All webhook delivery attempts are logged in the `webhook_deliveries` table, accessible via the API. Each log includes:
- Event name
- Status (success/failed/pending)
- HTTP response code
- Response body
- Number of attempts
- Last attempt timestamp

## Webhook Events

### Email Lifecycle Events

#### 1. `email.sent`

**Triggered when:** An email has been successfully sent from your account.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.sent",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "subject": "Welcome to our platform",
    "sent_at": "2024-01-15T10:30:00Z",
    "mail_server_id": "550e8400-e29b-41d4-a716-446655440000",
    "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
    "campaign_send_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 2. `email.delivered`

**Triggered when:** An email has been successfully delivered to the recipient's mail server.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.delivered",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:05Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "delivered_at": "2024-01-15T10:30:05Z",
    "message_id": "<message-id@example.com>"
  }
}
```

#### 3. `email.bounced.soft`

**Triggered when:** An email experiences a temporary (soft) bounce. The email address may be valid, but the message couldn't be delivered temporarily.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.bounced.soft",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:10Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "bounced_at": "2024-01-15T10:30:10Z",
    "bounce_reason": "Mailbox temporarily unavailable",
    "message_id": "<message-id@example.com>",
    "bounce_category": "mailbox_full",
    "diagnostic": "550 5.2.2 Mailbox full"
  }
}
```

#### 4. `email.bounced.hard`

**Triggered when:** An email experiences a permanent (hard) bounce. The email address is invalid or doesn't exist.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.bounced.hard",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:10Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "invalid@example.com",
    "bounced_at": "2024-01-15T10:30:10Z",
    "bounce_reason": "Email address does not exist",
    "message_id": "<message-id@example.com>",
    "bounce_category": "invalid_address",
    "diagnostic": "550 5.1.1 User unknown"
  }
}
```

#### 5. `email.deferred`

**Triggered when:** Email delivery is deferred by the recipient's mail server. The server is temporarily unable to accept the message.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.deferred",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:15Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "deferred_at": "2024-01-15T10:30:15Z",
    "defer_reason": "Server temporarily unavailable",
    "message_id": "<message-id@example.com>"
  }
}
```

#### 6. `email.opened`

**Triggered when:** A recipient opens an email. Only triggered for legitimate opens (bots are excluded).

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.opened",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:20Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "opened_at": "2024-01-15T10:30:20Z",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "country_code": "US"
  }
}
```

#### 7. `email.clicked`

**Triggered when:** A recipient clicks a link in an email. Only triggered for legitimate clicks (bots are excluded).

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.clicked",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:25Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "clicked_at": "2024-01-15T10:30:25Z",
    "url": "https://example.com/product",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "country_code": "US",
    "short_link_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 8. `email.bot.opened`

**Triggered when:** A bot or automated system opens an email. Includes bot detection analysis data.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.bot.opened",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:20Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "opened_at": "2024-01-15T10:30:20Z",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0 (compatible; bot/1.0)",
    "country_code": "US",
    "decision": {
      "is_bot": true,
      "bot_score": 0.95,
      "reasons": [
        "Automated user agent detected",
        "Suspicious IP pattern"
      ],
      // Additional bot detection fields from ComprehensiveBotAnalysisData
    }
  }
}
```

#### 9. `email.bot.clicked`

**Triggered when:** A bot or automated system clicks a link in an email. Includes bot detection analysis data.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.bot.clicked",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:25Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "clicked_at": "2024-01-15T10:30:25Z",
    "url": "https://example.com/product",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0 (compatible; bot/1.0)",
    "country_code": "US",
    "short_link_id": "550e8400-e29b-41d4-a716-446655440000",
    "decision": {
      "is_bot": true,
      "bot_score": 0.92,
      "reasons": [
        "Automated user agent detected",
        "Suspicious click pattern"
      ],
      // Additional bot detection fields from ComprehensiveBotAnalysisData
    }
  }
}
```

#### 10. `email.replied`

**Triggered when:** A recipient replies to an email sent from your account.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.replied",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:30Z",
  "payload": {
    "email_send_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "replied_at": "2024-01-15T10:30:30Z",
    "message_id": "<reply-message-id@example.com>",
    "in_reply_to": "<original-message-id@example.com>",
    "headers": {
      "From": "john.doe@example.com",
      "To": "support@falconyte.com",
      "Subject": "Re: Welcome to our platform",
      "Date": "Mon, 15 Jan 2024 10:30:30 +0000"
    },
    "subject": "Re: Welcome to our platform",
    "content": "Thank you for the email. I have a question about..."
  }
}
```

### Contact & Business Events

#### 11. `email.contact.saved`

**Triggered when:** A contact is created or updated in your audience.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.contact.saved",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:35Z",
  "payload": {
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "foreign_id": "ext-123",
    "country_code": "US",
    "created_at": "2024-01-15T10:30:35Z",
    "updated_at": "2024-01-15T10:30:35Z"
  }
}
```

#### 12. `email.contact.unsubscribed`

**Triggered when:** A contact unsubscribes from your emails.

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.contact.unsubscribed",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:40Z",
  "payload": {
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "unsubscribed_at": "2024-01-15T10:30:40Z",
    "unsubscribe_reason": "User clicked unsubscribe link",
    "unsubscribe_method": "link"
  }
}
```

#### 13. `email.lead.created`

**Triggered when:** A lead is created (typically when a contact performs a qualifying action).

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.lead.created",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:45Z",
  "payload": {
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "created_at": "2024-01-15T10:30:45Z",
    "source": "email_campaign",
    "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
    "campaign_send_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 14. `email.sale.created`

**Triggered when:** A sale is created (typically when a lead converts to a customer).

**Payload:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "email.sale.created",
  "team_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:50Z",
  "payload": {
    "sale_id": "550e8400-e29b-41d4-a716-446655440000",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "created_at": "2024-01-15T10:30:50Z",
    "amount": 99.99,
    "currency": "USD",
    "source": "email_campaign",
    "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
    "campaign_send_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Field Descriptions

### Common Fields Across Events

#### Identification Fields
- `email_send_log_id` (UUID): Unique identifier for the email send record
- `contact_id` (UUID): Unique identifier for the contact
- `email` (string): Contact's email address
- `campaign_id` (UUID, nullable): Campaign identifier if event is campaign-related
- `campaign_send_id` (UUID, nullable): Campaign send identifier if event is campaign-related

#### Tracking Fields
- `ip_address` (string, nullable): IP address of the event (for opens/clicks)
- `user_agent` (string, nullable): User agent string (for opens/clicks)
- `country_code` (string, nullable): ISO country code (2-letter, e.g., "US")
- `short_link_id` (UUID, nullable): Shortened link identifier (for clicks)
- `message_id` (string, nullable): Email message ID from mail server

#### Timestamp Fields
All timestamp fields use ISO 8601 format (e.g., "2024-01-15T10:30:00Z"):
- `sent_at`: When email was sent
- `delivered_at`: When email was delivered
- `opened_at`: When email was opened
- `clicked_at`: When link was clicked
- `replied_at`: When reply was received
- `bounced_at`: When bounce occurred
- `deferred_at`: When delivery was deferred
- `unsubscribed_at`: When contact unsubscribed
- `created_at`: When record was created
- `updated_at`: When record was updated

#### Bot Detection Fields (Bot Events Only)
- `decision` (object): Complete bot analysis data including:
  - `is_bot` (boolean): Whether the activity was classified as a bot
  - `bot_score` (float): Confidence score (0.0 to 1.0)
  - `reasons` (array): Array of strings describing why it was flagged as bot
  - Additional fields from `ComprehensiveBotAnalysisData` structure

#### Bounce-Specific Fields
- `bounce_reason` (string): Human-readable reason for the bounce
- `bounce_category` (string, nullable): Category of bounce (e.g., "mailbox_full", "invalid_address")
- `diagnostic` (string, nullable): Technical diagnostic information from mail server

#### Reply-Specific Fields
- `headers` (object): Email headers as associative array (From, To, Subject, Date, etc.)
- `subject` (string): Email subject line
- `content` (string, nullable): Plain text content of the reply
- `in_reply_to` (string, nullable): Message ID this reply is responding to

#### Business Event Fields
- `lead_id` (UUID): Unique identifier for the lead (lead.created event)
- `sale_id` (UUID): Unique identifier for the sale (sale.created event)
- `amount` (decimal, nullable): Sale amount (sale.created event)
- `currency` (string, nullable): Currency code (e.g., "USD") (sale.created event)
- `source` (string): Source of the lead/sale (e.g., "email_campaign")

## Webhook Configuration

### Active Webhook Limit
- Maximum **10 active (enabled) webhooks** per team
- Disabled webhooks don't count toward the limit
- You can create additional webhooks in disabled state even at the limit

### Event Selection
When creating a webhook, you must select at least one event type. The webhook will only be triggered for events you've subscribed to.

## Testing Webhooks

Use the **simulate endpoint** to test webhook payloads:

```
POST /api/v1/user/webhooks/simulate
```

**Request:**
```json
{
  "event": "email.sent"
}
```

**Response:**
Returns a sample payload matching the requested event type, identical to what would be sent in a real webhook delivery.

## Best Practices

1. **Always verify HMAC signatures** to ensure requests are from Falconyte
2. **Handle duplicate deliveries** - webhooks may be retried, so make your endpoint idempotent
3. **Respond quickly** - Aim for < 5 seconds response time to avoid timeouts
4. **Return 2xx status codes** - Any non-2xx response will trigger retries
5. **Store delivery IDs** - Use the `id` field to deduplicate events
6. **Monitor delivery logs** - Check delivery status via the API if issues occur

## Error Handling

### HTTP Status Codes

**Your endpoint should return:**
- `200 OK` or `202 Accepted`: Delivery successful, no retry
- Any other status: Delivery failed, will be retried according to retry schedule

### Common Issues

1. **Timeout**: Endpoint takes too long to respond (>30 seconds)
2. **Connection refused**: Endpoint is unreachable
3. **Invalid response**: Endpoint returns malformed response
4. **SSL errors**: Invalid SSL certificate on endpoint

All failures are logged in the delivery logs for debugging.

## Rate Limits

Webhooks are delivered asynchronously. There are no rate limits on webhook deliveries from Falconyte, but you should ensure your endpoint can handle the expected volume.

## Support

For issues with webhook delivery:
1. Check delivery logs via `GET /api/v1/user/webhooks/{webhook_id}/deliveries`
2. Verify your endpoint is accessible and responding correctly
3. Check HMAC signature verification is working
4. Review error messages in delivery logs

