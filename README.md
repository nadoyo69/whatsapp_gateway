# 🚀 WhatsApp Unofficial API Gateway & Vue.js Admin Dashboard

Sistem WhatsApp API Gateway unofficial modern berbasis **Baileys (`@whiskeysockets/baileys`)**, **Node.js (Express + Socket.IO)**, arsitektur **Hybrid Database (PostgreSQL + MongoDB)**, serta **Admin Dashboard Vue 3 (Vite + Tailwind CSS)** yang siap dijalankan secara instan dengan **Docker Compose**.

---

## 🌟 Fitur Utama

- 🔄 **Multi-Device & Multi-Session**: Jalankan banyak nomor / akun WhatsApp sekaligus dalam satu server.
- 📷 **Live QR Code Scanner & 8-Digit Pairing Code**: Scan QR realtime via WebSocket (Socket.IO) atau generate kode pairing via nomor HP.
- ⚡ **Hybrid Database Architecture**:
  - **PostgreSQL**: Manajemen User Admin, API Tokens, Perangkat/Sessions, dan Konfigurasi Sistem.
  - **MongoDB**: Penyimpanan riwayat pesan (Raw WhatsApp payload, text, media metadatas), Chat threads, dan Audit Webhook Logs.
- 📩 **Lengkap Semua Tipe Pesan**:
  - Teks (Markdown formatting WA, Mentions, Quote Reply)
  - Gambar / Foto (Upload file multipart atau via image URL) + Caption
  - Dokumen (PDF, Excel, Word, ZIP, dll) + custom filename
  - Audio & Voice Note / PTT (Format waveform WhatsApp)
  - Video MP4 + Caption
  - Lokasi GPS (Latitude / Longitude / Address)
  - Kontak (VCard 3.0)
  - Validasi Nomor WhatsApp (`check-number`)
- 🔔 **Webhook System**:
  - Event `message.received`: Forward pesan masuk ke endpoint Anda secara realtime (Teks, Media URL, Lokasi, Kontak).
  - Event `message.status`: Update status pengiriman (`server_ack`, `delivered`, `read` / centang biru).
  - Event `session.status`: Perubahan status koneksi perangkat (`connected`, `disconnected`, `qr_ready`, `logged_out`).
  - Webhook Tester & Logging detail (latency, status code, request body) di dashboard.
- 🛡️ **Keamanan & Autentikasi**:
  - JWT Authentication untuk Admin Dashboard.
  - API Key Token (`X-API-Key` atau `Authorization: Bearer <TOKEN>`) untuk integrasi sistem eksternal.
- 💻 **Admin Dashboard (Vue 3)**:
  - Monitoring Status & Statistik Session Realtime.
  - Interactive Message Sandbox (Kirim pesan/media langsung dari browser).
  - Live Chat Viewer & Thread History dari MongoDB.
  - Webhook Manager & Test Ping Sandbox.
  - API Key Generator & User Management.
  - Interactive Developer API Documentation (cURL, PHP/Laravel, Node.js, Python).

---

## 🐳 Menjalankan dengan Docker Compose

### 1. Masuk ke Direktori Project
```bash
cd /Users/nadoyo/Documents/RND/wa-gateway
```

### 2. Jalankan Docker Compose
```bash
docker compose up -d --build
```

### 3. Akses Layanan:
- **Admin Dashboard**: [http://localhost:8080](http://localhost:8080)
- **API Documentation**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **REST API Backend**: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL**: `localhost:5432` (User: `wa_admin`, Pass: `wa_secret_123`, DB: `wa_gateway_db`)
- **MongoDB**: `localhost:27017` (User: `wa_admin`, Pass: `wa_secret_123`, DB: `wa_gateway_logs`)

### 4. Kredensial Default:
- **Username**: `admin`
- **Password**: `admin123`
- **Default Master API Key**: `wa_secret_token_default_key_2026`

---

## 📖 Ringkasan Lengkap REST API Endpoints

Semua request REST API memerlukan API Key melalui salah satu header:
- `X-API-Key: <YOUR_API_KEY>`
- `Authorization: Bearer <YOUR_API_KEY>`

### 1. Manajemen Session & Device (PostgreSQL + Baileys)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/sessions` | List semua session & status koneksi |
| `POST` | `/api/v1/sessions/create` | Buat session baru `{ "sessionId": "sales1", "name": "Sales CS", "webhookUrl": "..." }` |
| `GET` | `/api/v1/sessions/:sessionId/status` | Cek status koneksi realtime dan info perangkat |
| `GET` | `/api/v1/sessions/:sessionId/qr` | Ambil QR code (base64 image & raw QR) |
| `POST` | `/api/v1/sessions/:sessionId/pairing-code` | Generate 8-digit pairing code via no HP `{ "phoneNumber": "628123456789" }` |
| `POST` | `/api/v1/sessions/:sessionId/restart` | Restart instance koneksi session |
| `POST` | `/api/v1/sessions/:sessionId/logout` | Logout dari WhatsApp & hapus kredensial session |
| `PUT` | `/api/v1/sessions/:sessionId/settings` | Update nama display, webhook URL, secret, dan opsi auto-read |
| `DELETE` | `/api/v1/sessions/:sessionId` | Hapus session secara permanen |

### 2. Pengiriman Pesan WhatsApp (Send APIs)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/messages/send-text` | Kirim pesan teks / markdown `{ "sessionId": "...", "to": "628...", "message": "..." }` |
| `POST` | `/api/v1/messages/send-image` | Kirim gambar via upload file multipart `file` atau `imageUrl` + `caption` |
| `POST` | `/api/v1/messages/send-document` | Kirim dokumen (PDF/Excel/Word) via file atau `documentUrl` + `filename` |
| `POST` | `/api/v1/messages/send-audio` | Kirim audio / Voice Note WhatsApp (`isPtt: true`) |
| `POST` | `/api/v1/messages/send-video` | Kirim video MP4 + caption via file atau `videoUrl` |
| `POST` | `/api/v1/messages/send-location` | Kirim koordinat GPS `{ "latitude": -6.2088, "longitude": 106.8456, "name": "..." }` |
| `POST` | `/api/v1/messages/send-contact` | Kirim kontak VCard `{ "contactName": "...", "contactPhone": "..." }` |

### 3. Validasi & Utility Tools
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/tools/check-number/:sessionId/:phone` | Cek apakah nomor terdaftar di WhatsApp & ambil valid JID |

### 4. Riwayat Chat & MongoDB Logs
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/chats/:sessionId` | Ambil daftar thread percakapan dari MongoDB (`?search=`, `?page=`) |
| `GET` | `/api/v1/chats/:sessionId/:jid/messages` | Ambil riwayat pesan dalam satu chat dari MongoDB |
| `GET` | `/api/v1/chats/stats/dashboard` | Ambil statistik aggregasi pesan dan webhook |
| `GET` | `/api/v1/webhooks/logs` | Ambil log pengiriman webhook dari MongoDB |
| `POST` | `/api/v1/webhooks/test` | Kirim test webhook ping ke URL tujuan |

### 5. API Key Management (PostgreSQL)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/api-keys` | List semua API keys |
| `POST` | `/api/v1/api-keys` | Generate API key baru `{ "name": "Laravel Backend" }` |
| `PATCH` | `/api/v1/api-keys/:id/toggle` | Aktifkan / nonaktifkan API key |
| `DELETE` | `/api/v1/api-keys/:id` | Revoke dan hapus API key |

### 6. User Management (PostgreSQL)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/users` | List semua pengguna admin & operator |
| `POST` | `/api/v1/users` | Buat user baru `{ "username": "...", "password": "...", "role": "admin" }` |
| `PUT` | `/api/v1/users/:id` | Update data / password user |
| `DELETE` | `/api/v1/users/:id` | Hapus user |

---

## 🔔 Spesifikasi Webhook & Format Tiap Event

Jika Webhook URL dikonfigurasikan pada session, Gateway akan mengirimkan **HTTP POST** dengan format payload JSON berikut:

### Header yang Dikirimkan:
```http
Content-Type: application/json
X-Webhook-Secret: <secret_anda>
Authorization: Bearer <secret_anda>
```

### 1. Event: `message.received` (Pesan Masuk - Teks)
```json
{
  "event": "message.received",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:45:00.000Z",
  "data": {
    "messageId": "3EB09F218492019A",
    "remoteJid": "628123456789@s.whatsapp.net",
    "phone": "628123456789",
    "senderName": "Budi Santoso",
    "isGroup": false,
    "type": "text",
    "text": "Halo admin, apakah stok barang ini masih ada?",
    "timestamp": "2026-08-18T13:45:00.000Z"
  }
}
```

### 2. Event: `message.received` (Pesan Masuk - Media / Gambar / Dokumen)
```json
{
  "event": "message.received",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:46:12.000Z",
  "data": {
    "messageId": "3EB0AA921820194B",
    "remoteJid": "628123456789@s.whatsapp.net",
    "phone": "628123456789",
    "senderName": "Budi Santoso",
    "isGroup": false,
    "type": "image",
    "text": "Bukti transfer",
    "mimetype": "image/jpeg",
    "filename": null,
    "timestamp": "2026-08-18T13:46:12.000Z"
  }
}
```

### 3. Event: `message.received` (Pesan Masuk - Lokasi GPS)
```json
{
  "event": "message.received",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:47:05.000Z",
  "data": {
    "messageId": "3EB0BB192019284C",
    "remoteJid": "628123456789@s.whatsapp.net",
    "phone": "628123456789",
    "senderName": "Budi Santoso",
    "isGroup": false,
    "type": "location",
    "location": {
      "lat": -6.2088,
      "lng": 106.8456,
      "name": "Grand Indonesia",
      "address": "Jakarta Pusat"
    },
    "timestamp": "2026-08-18T13:47:05.000Z"
  }
}
```

### 4. Event: `message.status` (Update Status Terkirim & Centang Biru)
```json
{
  "event": "message.status",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:48:30.000Z",
  "data": {
    "messageId": "3EB09F218492019A",
    "remoteJid": "628123456789@s.whatsapp.net",
    "status": "read"
  }
}
```
*Nilai status:*
- `server_ack`: Diterima server WhatsApp (Centang 1).
- `delivered`: Masuk ke HP penerima (Centang 2 abu-abu).
- `read`: Dibaca penerima (Centang 2 biru).

### 5. Event: `session.status` (Perubahan Status Koneksi Device)
```json
{
  "event": "session.status",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:50:00.000Z",
  "data": {
    "status": "connected",
    "phone": "628123456789",
    "name": "Customer Support 01"
  }
}
```

---

## 💻 Contoh Kode Integrasi

### PHP (Laravel)
```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'X-API-Key' => env('WA_API_KEY'),
])->post('http://localhost:3000/api/v1/messages/send-text', [
    'sessionId' => 'session_sales_01',
    'to' => '628123456789',
    'message' => 'Halo! Pesanan Anda *#INV-891* sedang diproses.'
]);

return $response->json();
```

### Node.js (Axios)
```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:3000/api/v1/messages/send-text', {
  sessionId: 'session_sales_01',
  to: '628123456789',
  message: 'Halo dari sistem eksternal!'
}, {
  headers: { 'X-API-Key': process.env.WA_API_KEY }
});

console.log(response.data);
```
