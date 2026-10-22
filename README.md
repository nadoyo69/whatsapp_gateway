# WhatsApp Gateway

A self-hosted, **unofficial** WhatsApp API gateway with an admin dashboard. It lets you connect one or more WhatsApp accounts, send messages through a REST API, and receive incoming messages and delivery status as webhooks.

- **Engine:** [Baileys](https://github.com/WhiskeySockets/Baileys) (`@whiskeysockets/baileys`)
- **Backend:** Node.js, Express, Socket.IO
- **Databases:** PostgreSQL (users, API keys, devices) and MongoDB (messages, chats, webhook logs)
- **Dashboard:** Vue 3, Vite, Tailwind CSS, served by Nginx
- **Deployment:** Docker Compose

> **Disclaimer.** This project is not affiliated with or endorsed by WhatsApp or Meta. It talks to WhatsApp through the unofficial Web protocol, which can violate WhatsApp's Terms of Service. Accounts used with it may be restricted or banned. Use it at your own risk, and do not use it for spam.

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [REST API reference](#rest-api-reference)
- [Webhooks](#webhooks)
- [Per-device options](#per-device-options)
- [Code examples](#code-examples)
- [Development and tests](#development-and-tests)
- [Deployment (CI/CD)](#deployment-cicd)
- [Backups](#backups)
- [Security checklist](#security-checklist)

---

## Features

- **Multiple devices:** run many WhatsApp numbers at once, each as its own session.
- **Two ways to link a device:** scan a live QR code in the dashboard, or request an 8-digit pairing code for a phone number.
- **Send every common message type:** text (with mentions), image, document, audio and voice note, video, location, and contact card.
- **Number check:** verify that a phone number is registered on WhatsApp before you send.
- **Webhooks:** receive `message.received`, `message.status`, and `session.status` events, signed with HMAC-SHA256, with optional automatic retries.
- **Message history:** incoming and outgoing messages and chat threads are stored in MongoDB (can be turned off per device).
- **Access control:** JWT login for the dashboard, API keys for external systems, and API keys can be limited to specific devices.
- **Dashboard:** device status, QR and pairing, message sandbox, chat viewer, webhook logs, API key and user management, usage reports, and built-in API documentation.

---

## Quick start

### Requirements

- Docker and Docker Compose v2
- A reverse proxy such as [Nginx Proxy Manager](https://nginxproxymanager.com/), or the local port mapping shown below

### 1. Create your configuration

```bash
cp .env.example .env
```

Open `.env` and replace **every** value that starts with `CHANGE_ME`. Generate strong values with:

```bash
openssl rand -hex 32
```

The backend will refuse to start if a required secret is missing, still a placeholder, or a known default (see [Configuration](#configuration)).

### 2. Create the proxy network

`docker-compose.yml` attaches the backend and frontend to an external network named `npm_network`, which your reverse proxy also joins. Create it once:

```bash
docker network create npm_network
```

### 3. Start the stack

```bash
docker compose up -d --build
```

### 4. Open the dashboard

By default the containers publish **no ports** to the host. Your reverse proxy should forward your domain to `wa-frontend:80` (dashboard and API) over `npm_network`.

To try it on your own machine without a proxy, create a `docker-compose.override.yml` next to `docker-compose.yml`:

```yaml
services:
  wa-frontend:
    ports:
      - "${FRONTEND_PORT:-8080}:80"
  wa-backend:
    ports:
      - "${BACKEND_PORT:-3000}:3000"
```

Then run `docker compose up -d` again and open `http://localhost:8080`. Sign in with `ADMIN_DEFAULT_USER` and `ADMIN_DEFAULT_PASS` from your `.env`.

The admin account and the master API key are created only on the **first start**, when the database is empty. Changing those values in `.env` later does not change existing accounts. Change the password in the dashboard instead.

### 5. Link a WhatsApp number

1. Go to **Devices / Sessions** and create a session.
2. Scan the QR code with WhatsApp on your phone (**Linked devices > Link a device**), or request a pairing code.
3. When the status turns **connected**, you can send messages.

---

## Configuration

All settings are environment variables, defined in `.env`.

| Variable | Required | Description |
|---|---|---|
| `DB_PASSWORD` | Yes | PostgreSQL password. |
| `MONGO_PASSWORD` | Yes | MongoDB password. |
| `JWT_SECRET` | Yes | Signs dashboard login tokens. At least 32 characters. |
| `DEFAULT_API_TOKEN` | First start | Master API key created on first start. At least 24 characters. |
| `ADMIN_DEFAULT_PASS` | First start | Password of the initial admin. At least 8 characters. |
| `ADMIN_DEFAULT_USER` | No | Initial admin username. Default: `admin`. |
| `ADMIN_DEFAULT_EMAIL` | No | Initial admin email. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` | No | PostgreSQL connection. Defaults match the compose file. |
| `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB`, `MONGO_USER` | No | MongoDB connection. Defaults match the compose file. |
| `DATABASE_URL`, `MONGO_URI` | No | Full connection strings. When set, they replace the individual settings above. |
| `LOG_LEVEL` | No | Baileys log level: `silent`, `warn`, `info`, or `debug`. Default: `silent`. |
| `FRONTEND_PORT`, `BACKEND_PORT` | No | Host ports used only by the optional override file shown above. |

**Secret validation.** On startup the backend rejects secrets that are empty, that still start with `CHANGE_ME`, or that match a default value once published in this repository. If you upgraded from an older version, rotate any secret that still uses an old default.

---

## Authentication

There are two kinds of credentials.

| Credential | Used for | How to get it |
|---|---|---|
| **JWT** | The dashboard, and any endpoint marked "dashboard only" | `POST /api/v1/auth/login`, valid for 7 days |
| **API key** | Your own systems calling the REST API | Dashboard > **API Keys** |

Send an API key in either header:

```http
X-API-Key: <your_api_key>
```

```http
Authorization: Bearer <your_api_key>
```

**Device scoping.** An API key can only use devices that are assigned to it, plus devices that are not assigned to any key. A session created with an API key is automatically assigned to that key. Dashboard (JWT) users can access every device.

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "<your_password>"}'
```

The response contains `data.token`. Send it as `Authorization: Bearer <token>`.

---

## REST API reference

The base path is `/api/v1`. Responses are JSON with a `success` flag. The "Auth" column shows which credential an endpoint accepts: **Key or JWT**, or **JWT** (dashboard only).

### Sessions and devices

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/sessions` | Key or JWT | List sessions and their connection status. |
| `POST` | `/sessions/create` | Key or JWT | Create a session: `{ "sessionId": "sales1", "name": "Sales", "webhookUrl": "...", "webhookSecret": "...", "autoRead": false }`. |
| `GET` | `/sessions/:sessionId/status` | Key or JWT | Live connection status and device info. |
| `GET` | `/sessions/:sessionId/qr` | Key or JWT | Current QR code (image and raw string). |
| `POST` | `/sessions/:sessionId/pairing-code` | Key or JWT | Request an 8-digit pairing code: `{ "phoneNumber": "628123456789" }`. |
| `POST` | `/sessions/:sessionId/restart` | Key or JWT | Restart the session connection. |
| `POST` | `/sessions/:sessionId/logout` | Key or JWT | Log out of WhatsApp and delete the stored credentials. |
| `PUT` | `/sessions/:sessionId/settings` | Key or JWT | Update `name`, `webhookUrl`, `webhookSecret`, `autoRead`, and (JWT only) `apiTokenId`. |
| `DELETE` | `/sessions/:sessionId` | Key or JWT | Delete the session permanently. |

`sessionId` may only contain lowercase letters, numbers, dashes, and underscores. Other characters are removed.

When you call `PUT /sessions/:sessionId/settings`, always send the current `webhookUrl` and `webhookSecret`. Omitting them clears both. `name` and `autoRead` keep their current value when omitted.

### Sending messages

Every send endpoint needs `sessionId` and `to` (a phone number with country code, for example `628123456789`).

| Method | Endpoint | Body |
|---|---|---|
| `POST` | `/messages/send-text` | `message`, optional `mentions` (array of phone numbers) |
| `POST` | `/messages/send-image` | `file` (multipart) or `imageUrl`, optional `caption` |
| `POST` | `/messages/send-document` | `file` (multipart) or `documentUrl`, optional `caption`, `filename`, `mimetype` |
| `POST` | `/messages/send-audio` | `file` (multipart) or `audioUrl`, optional `isPtt` (`true` sends a voice note) |
| `POST` | `/messages/send-video` | `file` (multipart) or `videoUrl`, optional `caption` |
| `POST` | `/messages/send-location` | `latitude`, `longitude`, optional `name`, `address` |
| `POST` | `/messages/send-contact` | `contactName`, `contactPhone` |

Uploaded files are limited to 50 MB. All send endpoints accept an API key or a JWT.

### Tools

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tools/check-number/:sessionId/:phone` | Key or JWT | Check whether a number is on WhatsApp and return its JID. |

### Chats and logs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/chats/:sessionId` | Key or JWT | List chat threads. Query: `search`, `page`, `limit`. |
| `GET` | `/chats/:sessionId/:jid/messages` | Key or JWT | Message history of one chat. |
| `GET` | `/chats/stats/dashboard` | Key or JWT | Aggregated message and webhook statistics. |
| `GET` | `/webhooks/logs` | Key or JWT | Webhook delivery log. Query: `sessionId`, `event`, `success`, `page`, `limit`. |
| `POST` | `/webhooks/test` | Key or JWT | Send a test event to a URL: `{ "url": "...", "secret": "...", "event": "test.ping" }`. |

### Administration (dashboard only)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Sign in and receive a JWT. |
| `GET` | `/auth/me` | Current user. |
| `POST` | `/auth/change-password` | `{ "oldPassword": "...", "newPassword": "..." }`. |
| `GET` `POST` | `/api-keys` | List API keys, or create one: `{ "name": "Backend" }`. |
| `PATCH` | `/api-keys/:id/toggle` | Enable or disable an API key. |
| `DELETE` | `/api-keys/:id` | Revoke and delete an API key. |
| `GET` `POST` | `/users` | List users, or create one: `{ "username": "...", "password": "...", "role": "admin" }`. |
| `PUT` `DELETE` | `/users/:id` | Update or delete a user. |
| `GET` | `/reports/summary`, `/reports/devices`, `/reports/api-keys`, `/reports/logs`, `/reports/chart` | Usage and analytics reports. |

### Health check

`GET /health` (also `/api/v1/health`) returns the status of PostgreSQL and MongoDB. It needs no authentication, so it works with uptime monitors.

---

## Webhooks

Set a `webhookUrl` (and optionally a `webhookSecret`) on a session. The gateway then sends an HTTP `POST` with a JSON body for each event. Any `2xx` response counts as delivered.

### Events

| Event | When it is sent |
|---|---|
| `message.received` | A message arrives from someone else. Your own outgoing messages are not sent. |
| `message.status` | Delivery status of a message changes. |
| `session.status` | The device connects, disconnects, or logs out. |

### Headers

```http
Content-Type: application/json
User-Agent: WA-Gateway-Webhook/1.0
X-Webhook-Secret: <your_secret>
Authorization: Bearer <your_secret>
X-Signature-Timestamp: 1760000000000
X-Signature: <hex hmac>
```

The four secret-related headers are sent only when the session has a `webhookSecret`.

### Verify the signature

`X-Signature` is the hex-encoded HMAC-SHA256 of `"<X-Signature-Timestamp>.<raw request body>"`, using your webhook secret as the key. Compute it over the **raw** body bytes, not over a re-serialized JSON object.

```javascript
const crypto = require('crypto');

function isValidSignature(rawBody, headers, secret, toleranceMs = 5 * 60 * 1000) {
  const timestamp = headers['x-signature-timestamp'];
  const signature = headers['x-signature'];
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > toleranceMs) return false; // replay protection

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

### Payloads

Every payload has the same envelope:

```json
{
  "event": "message.received",
  "sessionId": "sales1",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "data": { }
}
```

**`message.received`: text**

```json
{
  "messageId": "3EB09F218492019A",
  "remoteJid": "628123456789@s.whatsapp.net",
  "senderJid": "628123456789@s.whatsapp.net",
  "phone": "628123456789",
  "participant": null,
  "senderName": "Jane Doe",
  "isGroup": false,
  "type": "text",
  "text": "Hello, is this item still in stock?",
  "mimetype": null,
  "filename": null,
  "image_base64": null,
  "location": null,
  "contact": null,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

- For group messages, `isGroup` is `true`, `remoteJid` is the group, and `phone` and `participant` identify the sender.
- `type` is the message type, for example `text`, `image`, `document`, `audio`, `video`, `location`, or `contact`.
- `image_base64` is filled only for image messages, and only when media download is enabled for the device.
- `location` is `{ "lat", "lng", "name", "address" }` for location messages.
- `contact` is `{ "name", "vcard" }` for contact messages.

**`message.status`**

```json
{
  "messageId": "3EB09F218492019A",
  "remoteJid": "628123456789@s.whatsapp.net",
  "status": "read"
}
```

`status` is one of `server_ack` (accepted by WhatsApp), `delivered` (reached the recipient's phone), or `read` (the recipient opened it, including played voice notes).

**`session.status`**

```json
{
  "status": "connected",
  "phone": "628123456789",
  "name": "Customer Support"
}
```

`status` is one of `connected`, `disconnected` (includes a `reason` code), or `logged_out`.

### Retries

By default a failed webhook is attempted once. When retries are enabled for a device (see below), the gateway makes up to 5 attempts, waiting 0, 30, 60, 120, and 240 seconds before each one. Every attempt is recorded in the webhook log.

---

## Per-device options

Three flags on the `devices` table control privacy and reliability per device. They are not yet exposed in the dashboard or the API, so set them with SQL:

| Column | Default | Effect |
|---|---|---|
| `store_messages` | `true` | When `false`, messages and chat threads are **not** saved to MongoDB. Webhooks still fire. |
| `download_media` | `true` | When `false`, images are not downloaded, so `image_base64` stays `null`. |
| `webhook_retry` | `false` | When `true`, failed webhooks are retried as described above. |

Example:

```bash
docker exec -it wa-postgres psql -U wa_admin -d wa_gateway_db \
  -c "UPDATE devices SET store_messages = false, download_media = false, webhook_retry = true WHERE session_id = 'sales1';"
```

---

## Code examples

### cURL

```bash
curl -X POST http://localhost:8080/api/v1/messages/send-text \
  -H "X-API-Key: $WA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sales1", "to": "628123456789", "message": "Hello from the gateway!"}'
```

### Node.js

```javascript
const axios = require('axios');

const response = await axios.post(
  'http://localhost:8080/api/v1/messages/send-text',
  { sessionId: 'sales1', to: '628123456789', message: 'Hello from the gateway!' },
  { headers: { 'X-API-Key': process.env.WA_API_KEY } }
);

console.log(response.data);
```

### PHP (Laravel)

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'X-API-Key' => env('WA_API_KEY'),
])->post('http://localhost:8080/api/v1/messages/send-text', [
    'sessionId' => 'sales1',
    'to' => '628123456789',
    'message' => 'Your order *#INV-891* is being processed.',
]);

return $response->json();
```

### Python

```python
import os
import requests

response = requests.post(
    "http://localhost:8080/api/v1/messages/send-text",
    headers={"X-API-Key": os.environ["WA_API_KEY"]},
    json={"sessionId": "sales1", "to": "628123456789", "message": "Hello from the gateway!"},
    timeout=30,
)
print(response.json())
```

---

## Development and tests

Local development needs **Node.js 24 LTS** or newer, the same version the Docker images use.

```bash
cd backend
npm install
npm test
```

The tests cover webhook signing and retries, the per-device policy, and secret validation. They do not need a database.

To run the backend outside Docker you need reachable PostgreSQL and MongoDB servers and a `backend/.env` with the variables listed in [Configuration](#configuration). Then run `npm run dev`. For the dashboard, run `npm install` and `npm run dev` in `frontend/`.

---

## Deployment (CI/CD)

`.github/workflows/ci-cd.yml` builds the project on every push and pull request. On a push to `main` it also deploys to your server over SSH and sends an optional Telegram notification.

Add these under **Settings > Secrets and variables > Actions**:

| Secret | Description |
|---|---|
| `SERVER_HOST` | Server hostname or IP address. |
| `SERVER_USER` | SSH user. |
| `SERVER_SSH_KEY` | Private key used by the workflow to log in. |
| `SERVER_PORT` | SSH port (optional, default `22`). |
| `SERVER_PATH` | Directory on the server where the project lives. |
| `TELEGRAM_TOKEN`, `TELEGRAM_CHATID` | Optional, for deployment notifications. |

On the server, create `.env` in `SERVER_PATH` **before** the first deploy. The pipeline stops with an error when `.env` is missing, so it never starts with placeholder secrets. The server also needs read access to this repository over SSH, for example through a deploy key.

`scripts/deploy.sh` does the same thing by hand.

---

## Backups

```bash
bash scripts/backup.sh                                                    # PostgreSQL, MongoDB, and WhatsApp session files
bash scripts/restore.sh backups/wa_gateway_backup_YYYYMMDD_HHMMSS.tar.gz  # restore from an archive
```

Backups are written to `backups/` as one `.tar.gz` archive, and that folder is git-ignored. They contain WhatsApp credentials, so store them somewhere private and encrypted.

---

## Security checklist

Before exposing the gateway to the internet:

- [ ] Every `CHANGE_ME` value in `.env` is replaced with a strong, unique secret.
- [ ] The gateway is served over **HTTPS** by your reverse proxy.
- [ ] PostgreSQL and MongoDB are **not** published to the host or the internet. The compose file keeps them on an internal network.
- [ ] You changed the initial admin password, and use separate API keys per integration.
- [ ] Your webhook receiver verifies `X-Signature`.
- [ ] `.env`, `sessions/`, and `backups/` are never committed. A WhatsApp session folder gives full access to that WhatsApp account.

---

## License

No license file is included yet. Add a `LICENSE` file that matches how you want others to use this project.
