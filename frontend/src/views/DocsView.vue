<template>
  <div class="space-y-8 max-w-6xl mx-auto pb-16 animate-fadeIn">
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#111b21] via-[#162730] to-[#111b21] p-8 rounded-3xl border border-[#2a3942] shadow-xl">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 mb-2">
            <span class="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">NexforgexGateway v1.0.0</span>
            <span class="px-3 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">REST API</span>
            <span class="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">Realtime Webhooks</span>
          </div>
          <h1 class="text-2xl font-black text-white tracking-wide">Developer API & Webhooks Reference</h1>
          <p class="text-xs text-slate-400 mt-1">Panduan lengkap integrasi NexforgexGateway untuk sistem eksternal (Laravel, Node.js, Python, Golang, cURL, dll).</p>
        </div>
      </div>
    </div>

    <!-- Quick Navigation Category Bar -->
    <div class="flex items-center gap-2 p-1.5 bg-[#111b21] border border-[#2a3942] rounded-2xl overflow-x-auto sticky top-20 z-10 shadow-lg backdrop-blur-md">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        @click="activeCategory = cat.id"
        :class="[
          activeCategory === cat.id 
            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
        ]"
        class="px-4 py-2 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-2"
      >
        <span>{{ cat.icon }}</span>
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Multi-Language Code Snippet Selector -->
    <div class="flex items-center justify-between bg-[#111b21]/70 p-4 rounded-2xl border border-[#2a3942]">
      <div class="flex items-center gap-2 text-xs text-slate-300 font-semibold">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        Pilih Bahasa Pemrograman Contoh Kode:
      </div>
      <div class="flex items-center gap-1.5">
        <button 
          v-for="lang in ['cURL', 'PHP (Laravel)', 'Node.js (Axios)', 'Python (Requests)']" 
          :key="lang"
          @click="selectedLang = lang"
          :class="selectedLang === lang ? 'bg-emerald-600 text-white font-bold' : 'bg-[#202c33] text-slate-400 hover:text-white'"
          class="px-3 py-1.5 rounded-xl text-xs transition"
        >
          {{ lang }}
        </button>
      </div>
    </div>

    <!-- ==================== SECTION 1: AUTHENTICATION ==================== -->
    <div v-if="activeCategory === 'auth'" class="space-y-6">
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Autentikasi Header API
        </h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          Setiap request ke WhatsApp Gateway REST API wajib menyertakan API Key yang valid. API Key dapat digenerate pada menu <RouterLink to="/api-keys" class="text-emerald-400 underline font-semibold">API Keys</RouterLink>. 
          Anda dapat mengirimkan token melalui salah satu header berikut:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-[#0b141a] p-4 rounded-2xl border border-[#2a3942] space-y-2">
            <span class="text-xs font-bold text-emerald-400">Opsi 1: Custom Header (Direkomendasikan)</span>
            <pre class="text-xs font-mono text-slate-200">X-API-Key: wa_live_your_secret_api_key_here</pre>
          </div>
          <div class="bg-[#0b141a] p-4 rounded-2xl border border-[#2a3942] space-y-2">
            <span class="text-xs font-bold text-emerald-400">Opsi 2: Standard Bearer Token</span>
            <pre class="text-xs font-mono text-slate-200">Authorization: Bearer wa_live_your_secret_api_key_here</pre>
          </div>
        </div>

        <div class="bg-[#202c33]/50 p-4 rounded-2xl border border-[#2a3942] space-y-1 text-xs text-slate-300">
          <p class="font-bold text-white">Base URL Server:</p>
          <p class="font-mono text-emerald-400">http://localhost:3000/api/v1 (atau domain server gateway Anda)</p>
        </div>
      </div>
    </div>

    <!-- ==================== SECTION 2: SESSIONS & DEVICES ==================== -->
    <div v-if="activeCategory === 'sessions'" class="space-y-6">
      <!-- 1. List Sessions -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">GET</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/sessions</span>
          </div>
          <span class="text-xs text-slate-400">Menampilkan semua device & status koneksi WhatsApp</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre v-if="selectedLang === 'cURL'">curl -X GET http://localhost:3000/api/v1/sessions \
  -H "X-API-Key: wa_live_your_secret_key"</pre>
          <pre v-else-if="selectedLang === 'PHP (Laravel)'">$response = Http::withHeaders(['X-API-Key' => env('WA_API_KEY')])
    ->get('http://localhost:3000/api/v1/sessions');
return $response->json();</pre>
          <pre v-else-if="selectedLang === 'Node.js (Axios)'">const { data } = await axios.get('http://localhost:3000/api/v1/sessions', {
  headers: { 'X-API-Key': process.env.WA_API_KEY }
});</pre>
          <pre v-else>response = requests.get('http://localhost:3000/api/v1/sessions', headers={'X-API-Key': 'wa_live_key'})</pre>
        </div>
      </div>

      <!-- 2. Create Session -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/sessions/create</span>
          </div>
          <span class="text-xs text-slate-400">Membuat session device WhatsApp baru & mulai inisialisasi QR</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre v-if="selectedLang === 'cURL'">curl -X POST http://localhost:3000/api/v1/sessions/create \
  -H "X-API-Key: wa_live_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_cs_01",
    "name": "Customer Support 01",
    "webhookUrl": "https://your-app.com/api/webhook",
    "webhookSecret": "my_secret_token_123",
    "autoRead": false
  }'</pre>
          <pre v-else-if="selectedLang === 'PHP (Laravel)'">$response = Http::withHeaders(['X-API-Key' => env('WA_API_KEY')])
    ->post('http://localhost:3000/api/v1/sessions/create', [
        'sessionId' => 'session_cs_01',
        'name' => 'Customer Support 01',
        'webhookUrl' => 'https://your-app.com/api/webhook',
        'webhookSecret' => 'my_secret_token_123',
        'autoRead' => false
    ]);</pre>
          <pre v-else-if="selectedLang === 'Node.js (Axios)'">const res = await axios.post('http://localhost:3000/api/v1/sessions/create', {
  sessionId: 'session_cs_01',
  name: 'Customer Support 01',
  webhookUrl: 'https://your-app.com/api/webhook'
}, { headers: { 'X-API-Key': process.env.WA_API_KEY } });</pre>
          <pre v-else>response = requests.post('http://localhost:3000/api/v1/sessions/create', headers={'X-API-Key': 'key'}, json={'sessionId': 'session_cs_01', 'name': 'CS 1'})</pre>
        </div>
      </div>

      <!-- 3. Get QR Code -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">GET</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/sessions/:sessionId/qr</span>
          </div>
          <span class="text-xs text-slate-400">Mengambil QR Code Base64 image untuk scan WhatsApp</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X GET http://localhost:3000/api/v1/sessions/session_cs_01/qr \
  -H "X-API-Key: wa_live_your_secret_key"</pre>
        </div>
      </div>

      <!-- 4. Pairing Code -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/sessions/:sessionId/pairing-code</span>
          </div>
          <span class="text-xs text-slate-400">Generate 8-digit Pairing Code via nomor HP (tanpa scan QR kamera)</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X POST http://localhost:3000/api/v1/sessions/session_cs_01/pairing-code \
  -H "X-API-Key: wa_live_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "628123456789"
  }'</pre>
        </div>
      </div>

      <!-- 5. Status, Restart, Logout, Settings, Delete -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <h4 class="text-sm font-bold text-white">Endpoint Session Lainnya:</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <tbody class="divide-y divide-[#2a3942]">
              <tr>
                <td class="py-2.5 text-blue-400 font-bold">GET</td>
                <td class="py-2.5 text-white">/api/v1/sessions/:sessionId/status</td>
                <td class="py-2.5 text-slate-400 font-sans">Cek status koneksi realtime dan info user terkoneksi.</td>
              </tr>
              <tr>
                <td class="py-2.5 text-emerald-400 font-bold">POST</td>
                <td class="py-2.5 text-white">/api/v1/sessions/:sessionId/restart</td>
                <td class="py-2.5 text-slate-400 font-sans">Memulai ulang instance koneksi session Baileys.</td>
              </tr>
              <tr>
                <td class="py-2.5 text-amber-400 font-bold">POST</td>
                <td class="py-2.5 text-white">/api/v1/sessions/:sessionId/logout</td>
                <td class="py-2.5 text-slate-400 font-sans">Logout akun dari WhatsApp & hapus kredensial autentikasi.</td>
              </tr>
              <tr>
                <td class="py-2.5 text-purple-400 font-bold">PUT</td>
                <td class="py-2.5 text-white">/api/v1/sessions/:sessionId/settings</td>
                <td class="py-2.5 text-slate-400 font-sans">Update nama display, webhook URL, webhook secret, dan opsi autoRead.</td>
              </tr>
              <tr>
                <td class="py-2.5 text-rose-400 font-bold">DELETE</td>
                <td class="py-2.5 text-white">/api/v1/sessions/:sessionId</td>
                <td class="py-2.5 text-slate-400 font-sans">Hapus session secara permanen dari PostgreSQL & disk storage.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== SECTION 3: SENDING MESSAGES ==================== -->
    <div v-if="activeCategory === 'messaging'" class="space-y-6">
      <!-- 1. Send Text -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-text</span>
          </div>
          <span class="text-xs text-slate-400">Pesan Teks, Markdown, dan Mentions</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre v-if="selectedLang === 'cURL'">curl -X POST http://localhost:3000/api/v1/messages/send-text \
  -H "X-API-Key: wa_live_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_sales_01",
    "to": "628123456789",
    "message": "Halo! Pesanan *#INV-2026* telah terkonfirmasi.\n_Terima kasih telah berbelanja!_",
    "mentions": ["628123456789"]
  }'</pre>
          <pre v-else-if="selectedLang === 'PHP (Laravel)'">$response = Http::withHeaders(['X-API-Key' => env('WA_API_KEY')])
    ->post('http://localhost:3000/api/v1/messages/send-text', [
        'sessionId' => 'session_sales_01',
        'to' => '628123456789',
        'message' => 'Halo! Tagihan Anda sebesar *Rp 150.000* telah terbit.'
    ]);</pre>
          <pre v-else-if="selectedLang === 'Node.js (Axios)'">const res = await axios.post('http://localhost:3000/api/v1/messages/send-text', {
  sessionId: 'session_sales_01',
  to: '628123456789',
  message: 'Hello from Node.js!'
}, { headers: { 'X-API-Key': process.env.WA_API_KEY } });</pre>
          <pre v-else>response = requests.post('http://localhost:3000/api/v1/messages/send-text', headers={'X-API-Key': 'key'}, json={'sessionId': 'session_sales_01', 'to': '628123456789', 'message': 'Hello!'})</pre>
        </div>
      </div>

      <!-- 2. Send Image -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-image</span>
          </div>
          <span class="text-xs text-slate-400">Kirim Gambar (Upload File Multipart atau URL)</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre v-if="selectedLang === 'cURL'"># Opsi 1: Menggunakan URL Gambar
curl -X POST http://localhost:3000/api/v1/messages/send-image \
  -H "X-API-Key: wa_live_your_secret_key" \
  -F "sessionId=session_sales_01" \
  -F "to=628123456789" \
  -F "imageUrl=https://example.com/banner.jpg" \
  -F "caption=Promo Spesial Hari Ini!"

# Opsi 2: Upload File Lokal Multipart
curl -X POST http://localhost:3000/api/v1/messages/send-image \
  -H "X-API-Key: wa_live_your_secret_key" \
  -F "sessionId=session_sales_01" \
  -F "to=628123456789" \
  -F "file=@/path/to/image.png" \
  -F "caption=Struk Pembayaran"</pre>
          <pre v-else-if="selectedLang === 'PHP (Laravel)'">// Menggunakan URL Gambar di Laravel:
$response = Http::withHeaders(['X-API-Key' => env('WA_API_KEY')])
    ->asMultipart()
    ->post('http://localhost:3000/api/v1/messages/send-image', [
        ['name' => 'sessionId', 'contents' => 'session_sales_01'],
        ['name' => 'to', 'contents' => '628123456789'],
        ['name' => 'imageUrl', 'contents' => 'https://example.com/banner.jpg'],
        ['name' => 'caption', 'contents' => 'Promo Spesial']
    ]);</pre>
          <pre v-else-if="selectedLang === 'Node.js (Axios)'">const form = new FormData();
form.append('sessionId', 'session_sales_01');
form.append('to', '628123456789');
form.append('imageUrl', 'https://example.com/banner.jpg');
form.append('caption', 'Promo Hari Ini');

const res = await axios.post('http://localhost:3000/api/v1/messages/send-image', form, {
  headers: { ...form.getHeaders(), 'X-API-Key': process.env.WA_API_KEY }
});</pre>
          <pre v-else>requests.post('http://localhost:3000/api/v1/messages/send-image', headers={'X-API-Key': 'key'}, data={'sessionId': 'session_sales_01', 'to': '628123456789', 'imageUrl': 'https://example.com/banner.jpg', 'caption': 'Promo'})</pre>
        </div>
      </div>

      <!-- 3. Send Document -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-document</span>
          </div>
          <span class="text-xs text-slate-400">Kirim Dokumen PDF, Excel, Word, ZIP</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X POST http://localhost:3000/api/v1/messages/send-document \
  -H "X-API-Key: wa_live_your_secret_key" \
  -F "sessionId=session_sales_01" \
  -F "to=628123456789" \
  -F "file=@/path/to/Invoice-2026.pdf" \
  -F "filename=Invoice-Official.pdf" \
  -F "caption=Faktur Pajak dan Tagihan"</pre>
        </div>
      </div>

      <!-- 4. Send Audio / VN -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-audio</span>
          </div>
          <span class="text-xs text-slate-400">Kirim Audio File atau Voice Note (PTT Waveform)</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X POST http://localhost:3000/api/v1/messages/send-audio \
  -H "X-API-Key: wa_live_your_secret_key" \
  -F "sessionId=session_sales_01" \
  -F "to=628123456789" \
  -F "file=@/path/to/voice_note.mp3" \
  -F "isPtt=true"</pre>
        </div>
      </div>

      <!-- 5. Send Video -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-video</span>
          </div>
          <span class="text-xs text-slate-400">Kirim Video MP4</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X POST http://localhost:3000/api/v1/messages/send-video \
  -H "X-API-Key: wa_live_your_secret_key" \
  -F "sessionId=session_sales_01" \
  -F "to=628123456789" \
  -F "file=@/path/to/video.mp4" \
  -F "caption=Tutorial Penggunaan Produk"</pre>
        </div>
      </div>

      <!-- 6. Send Location -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-location</span>
          </div>
          <span class="text-xs text-slate-400">Kirim Pin Lokasi Peta GPS</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X POST http://localhost:3000/api/v1/messages/send-location \
  -H "X-API-Key: wa_live_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_sales_01",
    "to": "628123456789",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "name": "Kantor Pusat RND",
    "address": "Jakarta Pusat, Indonesia"
  }'</pre>
        </div>
      </div>

      <!-- 7. Send Contact -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/messages/send-contact</span>
          </div>
          <span class="text-xs text-slate-400">Kirim Kartu Kontak VCard WhatsApp</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X POST http://localhost:3000/api/v1/messages/send-contact \
  -H "X-API-Key: wa_live_your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_sales_01",
    "to": "628123456789",
    "contactName": "Ahmad CS",
    "contactPhone": "628987654321"
  }'</pre>
        </div>
      </div>
    </div>

    <!-- ==================== SECTION 4: TOOLS & NUMBER VERIFICATION ==================== -->
    <div v-if="activeCategory === 'tools'" class="space-y-6">
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">GET</span>
            <span class="font-mono text-xs font-bold text-white">/api/v1/tools/check-number/:sessionId/:phone</span>
          </div>
          <span class="text-xs text-slate-400">Validasi apakah nomor telepon terdaftar di WhatsApp</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>curl -X GET http://localhost:3000/api/v1/tools/check-number/session_sales_01/08123456789 \
  -H "X-API-Key: wa_live_your_secret_key"</pre>
        </div>

        <div class="bg-[#202c33]/50 p-4 rounded-2xl border border-[#2a3942] text-xs font-mono text-slate-300">
          <p class="text-slate-400 font-sans mb-1 font-bold">Contoh Response Jika Terdaftar:</p>
          <pre class="text-emerald-400">{
  "success": true,
  "exists": true,
  "data": {
    "jid": "628123456789@s.whatsapp.net",
    "phone": "628123456789"
  }
}</pre>
        </div>
      </div>
    </div>

    <!-- ==================== SECTION 5: WEBHOOKS & ALL EVENTS ==================== -->
    <div v-if="activeCategory === 'webhooks'" class="space-y-6">
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Spesifikasi Event Webhook WhatsApp
        </h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          Setiap kali terjadi aktivitas di akun WhatsApp Anda (pesan masuk, update centang biru terkirim/dibaca, atau status koneksi), sistem gateway akan mengirimkan <b>HTTP POST JSON</b> secara realtime ke URL Webhook yang Anda konfigurasikan.
        </p>

        <div class="bg-[#202c33]/50 p-4 rounded-2xl border border-[#2a3942] space-y-2 text-xs text-slate-300">
          <p class="font-bold text-white">Header Webhook yang Dikirimkan:</p>
          <ul class="list-disc pl-5 space-y-1 font-mono text-slate-200">
            <li><span class="text-emerald-400">Content-Type</span>: application/json</li>
            <li><span class="text-emerald-400">X-Webhook-Secret</span>: &lt;webhookSecret_yang_anda_set&gt;</li>
            <li><span class="text-emerald-400">Authorization</span>: Bearer &lt;webhookSecret_yang_anda_set&gt;</li>
          </ul>
        </div>
      </div>

      <!-- Event 1: message.received (Text) -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">EVENT</span>
            <span class="font-mono text-sm font-bold text-emerald-400">message.received (Pesan Teks Masuk)</span>
          </div>
          <span class="text-xs text-slate-400">Trigger saat pelanggan mengirim pesan teks ke WA Anda</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>{
  "event": "message.received",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:45:00.123Z",
  "data": {
    "messageId": "3EB09F218492019A",
    "remoteJid": "628123456789@s.whatsapp.net",
    "phone": "628123456789",
    "senderName": "Budi Santoso",
    "isGroup": false,
    "type": "text",
    "text": "Halo admin, apakah produk ini masih tersedia?",
    "timestamp": "2026-08-18T13:45:00.000Z"
  }
}</pre>
        </div>
      </div>

      <!-- Event 2: message.received (Media: Image, Doc, Audio) -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">EVENT</span>
            <span class="font-mono text-sm font-bold text-emerald-400">message.received (Media: Gambar / Dokumen / Audio)</span>
          </div>
          <span class="text-xs text-slate-400">Trigger saat pelanggan mengirim file media</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>{
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
    "text": "Bukti transfer pembayaran",
    "mimetype": "image/jpeg",
    "filename": null,
    "timestamp": "2026-08-18T13:46:12.000Z"
  }
}</pre>
        </div>
      </div>

      <!-- Event 3: message.received (Location / Contact) -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">EVENT</span>
            <span class="font-mono text-sm font-bold text-emerald-400">message.received (Lokasi GPS & Kontak)</span>
          </div>
          <span class="text-xs text-slate-400">Trigger saat pelanggan share location atau kontak</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>{
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
      "name": "Mall Grand Indonesia",
      "address": "Jl. M.H. Thamrin No.1, Jakarta Pusat"
    },
    "timestamp": "2026-08-18T13:47:05.000Z"
  }
}</pre>
        </div>
      </div>

      <!-- Event 4: message.status (Delivery Receipts & Blue Ticks) -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">EVENT</span>
            <span class="font-mono text-sm font-bold text-purple-400">message.status (Status Terkirim / Centang Biru)</span>
          </div>
          <span class="text-xs text-slate-400">Trigger saat status pesan terkirim berubah</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>{
  "event": "message.status",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:48:30.000Z",
  "data": {
    "messageId": "3EB09F218492019A",
    "remoteJid": "628123456789@s.whatsapp.net",
    "status": "read"
  }
}</pre>
        </div>

        <div class="bg-[#202c33]/50 p-4 rounded-2xl border border-[#2a3942] space-y-1 text-xs text-slate-300">
          <p class="font-bold text-white">Daftar Nilai Status:</p>
          <ul class="list-disc pl-5 space-y-1 font-mono text-slate-200">
            <li><code class="text-slate-400">server_ack</code>: Pesan telah diterima server WhatsApp (Centang 1).</li>
            <li><code class="text-cyan-400">delivered</code>: Pesan telah masuk ke HP penerima (Centang 2 abu-abu).</li>
            <li><code class="text-blue-400">read</code>: Pesan telah dibaca oleh penerima (Centang 2 biru / Read Receipt).</li>
          </ul>
        </div>
      </div>

      <!-- Event 5: session.status (Connection state) -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">EVENT</span>
            <span class="font-mono text-sm font-bold text-amber-400">session.status (Status Koneksi Perangkat)</span>
          </div>
          <span class="text-xs text-slate-400">Trigger saat status koneksi WA berubah (connect/disconnect/logout)</span>
        </div>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre>{
  "event": "session.status",
  "sessionId": "session_sales_01",
  "timestamp": "2026-08-18T13:50:00.000Z",
  "data": {
    "status": "connected",
    "phone": "628123456789",
    "name": "Customer Support WA"
  }
}</pre>
        </div>
      </div>

      <!-- Contoh Webhook Receiver Code -->
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <h4 class="text-sm font-bold text-white">Contoh Kode Receiver Webhook di Server Anda:</h4>

        <div class="bg-[#0b141a] p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#2a3942]">
          <pre v-if="selectedLang === 'PHP (Laravel)'">// routes/api.php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

Route::post('/wa-webhook', function (Request $request) {
    // 1. Verifikasi Secret Token
    $secret = $request->header('X-Webhook-Secret');
    if ($secret !== env('MY_WA_WEBHOOK_SECRET')) {
        return response()->json(['error' => 'Unauthorized secret'], 401);
    }

    $event = $request->input('event');
    $sessionId = $request->input('sessionId');
    $data = $request->input('data');

    if ($event === 'message.received') {
        $senderPhone = $data['phone'];
        $messageText = $data['text'];
        Log::info("Pesan masuk dari $senderPhone: $messageText");

        // Proses auto reply atau bot di sini...
    }

    return response()->json(['status' => 'success']);
});</pre>

          <pre v-else>// Express.js Webhook Receiver
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/wa-webhook', (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.MY_WA_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized secret' });
  }

  const { event, sessionId, data } = req.body;
  console.log(`[Webhook Event: ${event}] from Session: ${sessionId}`, data);

  if (event === 'message.received') {
    // Handle incoming message from data.phone, data.text
  }

  res.json({ success: true });
});

app.listen(8000);</pre>
        </div>
      </div>
    </div>

    <!-- ==================== SECTION 6: CHAT & ARCHIVE LOGS ==================== -->
    <div v-if="activeCategory === 'chats'" class="space-y-6">
      <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          Chat & Message History API
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <tbody class="divide-y divide-[#2a3942]">
              <tr>
                <td class="py-3 text-blue-400 font-bold">GET</td>
                <td class="py-3 text-white">/api/v1/chats/:sessionId</td>
                <td class="py-3 text-slate-400 font-sans">Ambil daftar percakapan / contact threads (mendukung query <code>?search=</code> & <code>?page=</code>).</td>
              </tr>
              <tr>
                <td class="py-3 text-blue-400 font-bold">GET</td>
                <td class="py-3 text-white">/api/v1/chats/:sessionId/:jid/messages</td>
                <td class="py-3 text-slate-400 font-sans">Ambil riwayat pesan masuk dan keluar dengan kontak WhatsApp tertentu.</td>
              </tr>
              <tr>
                <td class="py-3 text-blue-400 font-bold">GET</td>
                <td class="py-3 text-white">/api/v1/chats/stats/dashboard</td>
                <td class="py-3 text-slate-400 font-sans">Statistik aggregasi total pesan, volume 24 jam, dan success rate webhook.</td>
              </tr>
              <tr>
                <td class="py-3 text-blue-400 font-bold">GET</td>
                <td class="py-3 text-white">/api/v1/webhooks/logs</td>
                <td class="py-3 text-slate-400 font-sans">Ambil riwayat log pengiriman webhook (query <code>?event=</code>, <code>?success=</code>).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedLang = ref('cURL');
const activeCategory = ref('webhooks');

const categories = [
  { id: 'webhooks', label: 'Webhooks & Events (Lengkap)', icon: '🔔' },
  { id: 'messaging', label: 'Kirim Pesan (Send API)', icon: '💬' },
  { id: 'sessions', label: 'Sessions & Device QR', icon: '📱' },
  { id: 'tools', label: 'Tools & Cek Nomor', icon: '🔍' },
  { id: 'chats', label: 'Chat & Message History', icon: '📂' },
  { id: 'auth', label: 'Autentikasi & Header', icon: '🔑' }
];
</script>
