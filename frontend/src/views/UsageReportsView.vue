<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Header & Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111b21] via-[#15242c] to-[#111b21] p-6 rounded-3xl border border-[#2a3942] shadow-xl">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-white">Usage & Analytics Reports</h2>
          <span class="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
            Realtime Engine
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Monitor message throughput and API consumption per WhatsApp device and client API key
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Date Range Filter -->
        <div class="flex items-center bg-[#202c33] p-1 rounded-xl border border-[#2a3942] text-xs">
          <button
            v-for="r in rangeOptions"
            :key="r.id"
            @click="setRange(r.id)"
            :class="[
              selectedRange === r.id
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            ]"
            class="px-3 py-1.5 rounded-lg transition"
          >
            {{ r.label }}
          </button>
        </div>

        <!-- Refresh Button -->
        <button
          @click="fetchAllReports"
          :disabled="loading"
          title="Refresh Data"
          class="p-2.5 bg-[#202c33] hover:bg-slate-700 text-slate-300 border border-[#2a3942] rounded-xl text-xs transition disabled:opacity-50"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Export XLSX Dropdown / Buttons -->
        <div class="flex items-center gap-1.5">
          <button
            @click="exportCurrentTabXlsx"
            title="Download Excel spreadsheet for current tab"
            class="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-700/20"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Tab (.xlsx)
          </button>

          <button
            @click="exportFullWorkbookXlsx"
            title="Export complete 3-sheet Excel workbook (Devices, API Keys, Audit Logs)"
            class="px-3.5 py-2 rounded-xl bg-[#202c33] hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5 shadow"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Full Book (.xlsx)
          </button>
        </div>
      </div>
    </div>

    <!-- KPI Metric Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Sent Messages -->
      <div class="glass-panel p-5 rounded-2xl border border-[#2a3942] flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Total Outgoing (Sent)</p>
          <h3 class="text-2xl font-black text-emerald-400 mt-1">
            {{ summary?.messages?.sent?.toLocaleString() || 0 }}
          </h3>
          <span class="text-[11px] text-slate-400 mt-1 block">
            from {{ summary?.messages?.total?.toLocaleString() || 0 }} total records
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>

      <!-- Total Received Messages -->
      <div class="glass-panel p-5 rounded-2xl border border-[#2a3942] flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Total Incoming (Received)</p>
          <h3 class="text-2xl font-black text-cyan-400 mt-1">
            {{ summary?.messages?.received?.toLocaleString() || 0 }}
          </h3>
          <span class="text-[11px] text-slate-400 mt-1 block">
            incoming customer chats
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Total API Calls -->
      <div class="glass-panel p-5 rounded-2xl border border-[#2a3942] flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Total API Hits</p>
          <h3 class="text-2xl font-black text-purple-400 mt-1">
            {{ summary?.api?.totalCalls?.toLocaleString() || 0 }}
          </h3>
          <span class="text-[11px] text-slate-400 mt-1 block">
            avg latency {{ summary?.api?.avgLatencyMs || 0 }}ms
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <!-- Success Rate -->
      <div class="glass-panel p-5 rounded-2xl border border-[#2a3942] flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">API Success Rate</p>
          <h3 class="text-2xl font-black text-amber-400 mt-1">
            {{ summary?.api?.successRate || '100%' }}
          </h3>
          <span class="text-[11px] text-emerald-400 mt-1 block">
            {{ summary?.api?.successCalls || 0 }} ok / {{ summary?.api?.errorCalls || 0 }} errors
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- VISUAL TRAFFIC CHART SECTION -->
    <div class="glass-panel p-6 rounded-3xl border border-[#2a3942] shadow-xl space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2a3942]">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            WhatsApp Message Traffic Analytics
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Incoming vs Outgoing message volume comparison across active WhatsApp sessions
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Chart Mode Switcher -->
          <div class="flex items-center bg-[#202c33] p-1 rounded-xl border border-[#2a3942] text-xs">
            <button
              @click="setChartMode('sessions')"
              :class="[
                chartMode === 'sessions'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
              class="px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Per Session (Bar)
            </button>
            <button
              @click="setChartMode('timeline')"
              :class="[
                chartMode === 'timeline'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
              class="px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Daily Trend (Line)
            </button>
          </div>

          <!-- Session Filter for Timeline -->
          <div v-if="chartMode === 'timeline'" class="flex items-center gap-2">
            <select
              v-model="selectedTimelineSession"
              @change="fetchTrafficChart"
              class="px-3 py-1.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Sessions Combined</option>
              <option v-for="s in deviceReports" :key="s.sessionId" :value="s.sessionId">
                {{ s.name }} ({{ s.sessionId }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Chart Legend & Status -->
      <div class="flex items-center justify-between text-xs text-slate-400 px-1">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-emerald-500"></span>
            <span class="text-white font-medium">Outgoing (Sent)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-cyan-500"></span>
            <span class="text-white font-medium">Incoming (Received)</span>
          </div>
        </div>
        <span class="text-[11px] text-slate-500">Auto-synced with MongoDB message records</span>
      </div>

      <!-- Chart Canvas Wrapper -->
      <div class="relative h-72 w-full">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex items-center border-b border-[#2a3942] gap-6">
      <button
        @click="activeTab = 'devices'"
        :class="[
          activeTab === 'devices'
            ? 'border-emerald-500 text-emerald-400 font-bold'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
        class="pb-3 border-b-2 text-sm transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span>Usage Per Device (WhatsApp)</span>
        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">{{ deviceReports.length }}</span>
      </button>

      <button
        @click="activeTab = 'api-keys'"
        :class="[
          activeTab === 'api-keys'
            ? 'border-emerald-500 text-emerald-400 font-bold'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
        class="pb-3 border-b-2 text-sm transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span>Usage Per API Key</span>
        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">{{ apiKeyReports.length }}</span>
      </button>

      <button
        @click="activeTab = 'logs'"
        :class="[
          activeTab === 'logs'
            ? 'border-emerald-500 text-emerald-400 font-bold'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
        class="pb-3 border-b-2 text-sm transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Live Audit Logs</span>
      </button>
    </div>

    <!-- TAB 1: USAGE PER DEVICE -->
    <div v-if="activeTab === 'devices'" class="space-y-4">
      <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
        <div class="p-4 bg-[#202c33]/40 border-b border-[#2a3942] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-white">Device Throughput Breakdown</h3>
            <p class="text-xs text-slate-400">Total incoming, outgoing, and message types processed by each WhatsApp session</p>
          </div>
          <div class="w-full sm:w-64">
            <input
              v-model="deviceSearch"
              type="text"
              placeholder="Filter by device or number..."
              class="w-full px-3.5 py-1.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div v-if="filteredDevices.length === 0" class="p-12 text-center text-xs text-slate-400">
          No device records found matching your filter or within selected period.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
              <tr>
                <th class="px-5 py-3.5">Device / Session</th>
                <th class="px-5 py-3.5">Status</th>
                <th class="px-5 py-3.5">Outgoing (Sent)</th>
                <th class="px-5 py-3.5">Incoming (Rcvd)</th>
                <th class="px-5 py-3.5">Delivery Rate</th>
                <th class="px-5 py-3.5">Message Types</th>
                <th class="px-5 py-3.5">API Calls</th>
                <th class="px-5 py-3.5">Last Activity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2a3942]/60">
              <tr v-for="dev in filteredDevices" :key="dev.id" class="hover:bg-[#202c33]/40 transition">
                <!-- Device Info -->
                <td class="px-5 py-4">
                  <div class="font-bold text-white text-sm">{{ dev.name }}</div>
                  <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>{{ dev.phoneNumber ? '+' + dev.phoneNumber : 'No phone' }}</span>
                    <span class="text-slate-600">•</span>
                    <span class="text-slate-500">{{ dev.sessionId }}</span>
                  </div>
                </td>

                <!-- Status Badge -->
                <td class="px-5 py-4">
                  <span
                    :class="[
                      dev.status === 'connected'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    ]"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border inline-flex items-center gap-1.5"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="dev.status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                    {{ dev.status === 'connected' ? 'Connected' : 'Disconnected' }}
                  </span>
                </td>

                <!-- Sent -->
                <td class="px-5 py-4">
                  <div class="text-sm font-bold text-emerald-400">
                    {{ dev.messages?.sent?.toLocaleString() || 0 }}
                  </div>
                  <div class="text-[10px] text-slate-500">messages sent</div>
                </td>

                <!-- Received -->
                <td class="px-5 py-4">
                  <div class="text-sm font-bold text-cyan-400">
                    {{ dev.messages?.received?.toLocaleString() || 0 }}
                  </div>
                  <div class="text-[10px] text-slate-500">messages received</div>
                </td>

                <!-- Delivery Rate Progress -->
                <td class="px-5 py-4 w-36">
                  <div class="flex items-center justify-between text-[11px] font-medium mb-1">
                    <span class="text-slate-300">{{ dev.messages?.deliveryRate }}</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      :style="{ width: dev.messages?.deliveryRate || '100%' }"
                    ></div>
                  </div>
                </td>

                <!-- Types Breakdown -->
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-1 max-w-xs">
                    <span v-if="dev.messages?.types?.text" class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                      Text: {{ dev.messages.types.text }}
                    </span>
                    <span v-if="dev.messages?.types?.image" class="px-1.5 py-0.5 rounded bg-blue-900/40 text-[10px] text-blue-300 font-mono">
                      Image: {{ dev.messages.types.image }}
                    </span>
                    <span v-if="dev.messages?.types?.document" class="px-1.5 py-0.5 rounded bg-amber-900/40 text-[10px] text-amber-300 font-mono">
                      Doc: {{ dev.messages.types.document }}
                    </span>
                    <span v-if="dev.messages?.types?.audio" class="px-1.5 py-0.5 rounded bg-purple-900/40 text-[10px] text-purple-300 font-mono">
                      Audio: {{ dev.messages.types.audio }}
                    </span>
                    <span v-if="!dev.messages?.total" class="text-slate-500 text-[11px]">
                      No messages yet
                    </span>
                  </div>
                </td>

                <!-- API Calls Routed -->
                <td class="px-5 py-4">
                  <span class="font-bold text-white">{{ dev.apiCalls }}</span>
                  <span class="text-[10px] text-slate-400 block">calls</span>
                </td>

                <!-- Last Activity -->
                <td class="px-5 py-4 text-slate-400 text-[11px]">
                  {{ formatDate(dev.lastActivity) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: USAGE PER API KEY -->
    <div v-if="activeTab === 'api-keys'" class="space-y-4">
      <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
        <div class="p-4 bg-[#202c33]/40 border-b border-[#2a3942] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-white">Client API Key Usage Metrics</h3>
            <p class="text-xs text-slate-400">Total API calls, error rates, and endpoints used by external integrations</p>
          </div>
          <div class="w-full sm:w-64">
            <input
              v-model="apiKeySearch"
              type="text"
              placeholder="Filter by token name or owner..."
              class="w-full px-3.5 py-1.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div v-if="filteredApiKeys.length === 0" class="p-12 text-center text-xs text-slate-400">
          No API keys found matching your filter.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
              <tr>
                <th class="px-5 py-3.5">API Key / Application</th>
                <th class="px-5 py-3.5">Owner</th>
                <th class="px-5 py-3.5">Total Hits</th>
                <th class="px-5 py-3.5">Success Rate</th>
                <th class="px-5 py-3.5">Errors (4xx / 5xx)</th>
                <th class="px-5 py-3.5">Avg Latency</th>
                <th class="px-5 py-3.5">Top Endpoints</th>
                <th class="px-5 py-3.5">Last Request</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2a3942]/60">
              <tr v-for="k in filteredApiKeys" :key="k.id" class="hover:bg-[#202c33]/40 transition">
                <!-- Key Info -->
                <td class="px-5 py-4">
                  <div class="font-bold text-white text-sm flex items-center gap-2">
                    {{ k.name }}
                    <span v-if="!k.isActive" class="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-normal border border-rose-500/20">
                      Disabled
                    </span>
                  </div>
                  <div class="font-mono text-[11px] text-emerald-400/80 mt-0.5">
                    {{ k.tokenPreview }}
                  </div>
                </td>

                <!-- Owner -->
                <td class="px-5 py-4 text-slate-300 font-medium">
                  {{ k.owner }}
                </td>

                <!-- Total Hits -->
                <td class="px-5 py-4">
                  <div class="text-sm font-black text-purple-400">
                    {{ k.totalRequests.toLocaleString() }}
                  </div>
                  <div class="text-[10px] text-slate-500">requests</div>
                </td>

                <!-- Success Rate Bar -->
                <td class="px-5 py-4 w-32">
                  <div class="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span :class="parseInt(k.successRate) >= 90 ? 'text-emerald-400' : 'text-amber-400'">
                      {{ k.successRate }}
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="parseInt(k.successRate) >= 90 ? 'bg-emerald-500' : 'bg-amber-500'"
                      :style="{ width: k.successRate }"
                    ></div>
                  </div>
                </td>

                <!-- Errors -->
                <td class="px-5 py-4">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-amber-300 font-mono" title="Client Errors (4xx)">
                      4xx: {{ k.clientErrors }}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-rose-500/15 text-[11px] text-rose-400 font-mono" title="Server Errors (5xx)">
                      5xx: {{ k.serverErrors }}
                    </span>
                  </div>
                </td>

                <!-- Avg Latency -->
                <td class="px-5 py-4">
                  <span
                    :class="[
                      k.avgLatencyMs < 300 ? 'text-emerald-400' : k.avgLatencyMs < 1000 ? 'text-amber-400' : 'text-rose-400'
                    ]"
                    class="font-mono font-bold"
                  >
                    {{ k.avgLatencyMs }}ms
                  </span>
                </td>

                <!-- Top Endpoints -->
                <td class="px-5 py-4">
                  <div v-if="k.topEndpoints.length > 0" class="space-y-1">
                    <div
                      v-for="ep in k.topEndpoints"
                      :key="ep.endpoint"
                      class="flex items-center gap-1.5 text-[10px] font-mono text-slate-300"
                    >
                      <span class="truncate max-w-[150px] text-slate-400">{{ ep.endpoint.replace('/api/v1', '') }}</span>
                      <span class="px-1 py-0.2 rounded bg-slate-800 text-emerald-400 font-bold">({{ ep.count }})</span>
                    </div>
                  </div>
                  <span v-else class="text-slate-500 text-[11px]">No activity yet</span>
                </td>

                <!-- Last Request -->
                <td class="px-5 py-4 text-slate-400 text-[11px]">
                  {{ formatDate(k.lastRequestAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: LIVE AUDIT LOGS -->
    <div v-if="activeTab === 'logs'" class="space-y-4">
      <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
        <!-- Log Filter Bar -->
        <div class="p-4 bg-[#202c33]/40 border-b border-[#2a3942] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-white">Recent API Calls Audit Trail</h3>
            <p class="text-xs text-slate-400">Detailed records of requests received, execution latency, and return status codes</p>
          </div>

          <div class="flex items-center gap-2.5">
            <select
              v-model="logStatusFilter"
              @change="fetchRecentLogs"
              class="px-3 py-1.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Status Codes</option>
              <option value="success">Success (2xx)</option>
              <option value="error">Errors (4xx / 5xx)</option>
            </select>

            <button
              @click="fetchRecentLogs"
              class="px-3 py-1.5 bg-[#202c33] hover:bg-slate-700 text-slate-200 border border-[#2a3942] rounded-xl text-xs transition font-semibold"
            >
              Apply Filter
            </button>
          </div>
        </div>

        <div v-if="auditLogs.length === 0" class="p-12 text-center text-xs text-slate-400">
          No audit logs recorded yet. Try sending a message via the Message Sandbox or external API.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
              <tr>
                <th class="px-5 py-3.5">Timestamp</th>
                <th class="px-5 py-3.5">Method & Endpoint</th>
                <th class="px-5 py-3.5">Status Code</th>
                <th class="px-5 py-3.5">API Token</th>
                <th class="px-5 py-3.5">Target Device</th>
                <th class="px-5 py-3.5">Latency</th>
                <th class="px-5 py-3.5">Caller IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2a3942]/60">
              <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-[#202c33]/40 transition">
                <!-- Time -->
                <td class="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {{ formatTime(log.created_at) }}
                </td>

                <!-- Endpoint & Method -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2">
                    <span
                      :class="log.method === 'POST' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'"
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                    >
                      {{ log.method }}
                    </span>
                    <span class="font-mono text-white text-[11px]">{{ log.endpoint }}</span>
                  </div>
                </td>

                <!-- Status Code -->
                <td class="px-5 py-3.5">
                  <span
                    :class="[
                      log.status_code >= 200 && log.status_code < 300
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : log.status_code >= 400 && log.status_code < 500
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    ]"
                    class="px-2 py-0.5 rounded font-mono font-bold text-[11px] border"
                  >
                    {{ log.status_code }}
                  </span>
                </td>

                <!-- API Token -->
                <td class="px-5 py-3.5 text-slate-300">
                  {{ log.token_name || 'Dashboard (JWT)' }}
                </td>

                <!-- Target Device -->
                <td class="px-5 py-3.5">
                  <span v-if="log.device_name" class="font-medium text-white">{{ log.device_name }}</span>
                  <span v-else-if="log.session_id" class="font-mono text-slate-400 text-[11px]">{{ log.session_id }}</span>
                  <span v-else class="text-slate-500">-</span>
                </td>

                <!-- Latency -->
                <td class="px-5 py-3.5 font-mono text-slate-400">
                  {{ log.response_time_ms }}ms
                </td>

                <!-- IP -->
                <td class="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                  {{ log.ip_address || '127.0.0.1' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="logPagination.totalPages > 1" class="p-4 bg-[#202c33]/30 border-t border-[#2a3942] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span class="text-white font-bold">{{ logPagination.page }}</span> of <span class="text-white font-bold">{{ logPagination.totalPages }}</span> ({{ logPagination.total }} logs)
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="changeLogPage(logPagination.page - 1)"
              :disabled="logPagination.page <= 1"
              class="px-3 py-1 bg-[#202c33] hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white transition"
            >
              Previous
            </button>
            <button
              @click="changeLogPage(logPagination.page + 1)"
              :disabled="logPagination.page >= logPagination.totalPages"
              class="px-3 py-1 bg-[#202c33] hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';
import api from '../services/api';

const loading = ref(false);
const activeTab = ref('devices'); // 'devices' | 'api-keys' | 'logs'
const selectedRange = ref('30d');

const rangeOptions = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All Time' }
];

const summary = ref(null);
const deviceReports = ref([]);
const apiKeyReports = ref([]);
const auditLogs = ref([]);

const deviceSearch = ref('');
const apiKeySearch = ref('');
const logStatusFilter = ref('');

// Chart states
const chartCanvas = ref(null);
let chartInstance = null;
const chartMode = ref('sessions'); // 'sessions' | 'timeline'
const selectedTimelineSession = ref('all');
const trafficData = ref({
  sessionsComparison: [],
  timeline: []
});

const logPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1
});

// Filtered Devices
const filteredDevices = computed(() => {
  if (!deviceSearch.value) return deviceReports.value;
  const q = deviceSearch.value.toLowerCase();
  return deviceReports.value.filter(d => 
    d.name?.toLowerCase().includes(q) ||
    d.sessionId?.toLowerCase().includes(q) ||
    d.phoneNumber?.includes(q)
  );
});

// Filtered API Keys
const filteredApiKeys = computed(() => {
  if (!apiKeySearch.value) return apiKeyReports.value;
  const q = apiKeySearch.value.toLowerCase();
  return apiKeyReports.value.filter(k => 
    k.name?.toLowerCase().includes(q) ||
    k.owner?.toLowerCase().includes(q)
  );
});

// Fetch Summary
const fetchSummary = async () => {
  try {
    const res = await api.get(`/reports/summary?range=${selectedRange.value}`);
    if (res.data.success) {
      summary.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch summary:', err);
  }
};

// Fetch Device Reports
const fetchDeviceReports = async () => {
  try {
    const res = await api.get(`/reports/devices?range=${selectedRange.value}`);
    if (res.data.success) {
      deviceReports.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch device reports:', err);
  }
};

// Fetch API Key Reports
const fetchApiKeyReports = async () => {
  try {
    const res = await api.get(`/reports/api-keys?range=${selectedRange.value}`);
    if (res.data.success) {
      apiKeyReports.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch API key reports:', err);
  }
};

// Fetch Recent Logs
const fetchRecentLogs = async () => {
  try {
    let url = `/reports/logs?page=${logPagination.value.page}&limit=${logPagination.value.limit}`;
    if (logStatusFilter.value) {
      url += `&status=${logStatusFilter.value}`;
    }
    const res = await api.get(url);
    if (res.data.success) {
      auditLogs.value = res.data.data;
      logPagination.value = res.data.pagination;
    }
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
  }
};

// Fetch Traffic Chart Data
const fetchTrafficChart = async () => {
  try {
    const url = `/reports/chart?range=${selectedRange.value}&sessionId=${selectedTimelineSession.value}`;
    const res = await api.get(url);
    if (res.data.success) {
      trafficData.value = res.data.data;
      renderChart();
    }
  } catch (err) {
    console.error('Failed to fetch traffic chart:', err);
  }
};

const setChartMode = (mode) => {
  chartMode.value = mode;
  renderChart();
};

const renderChart = () => {
  nextTick(() => {
    if (!chartCanvas.value) return;

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    const ctx = chartCanvas.value.getContext('2d');

    if (chartMode.value === 'sessions') {
      const labels = trafficData.value.sessionsComparison.map(s => s.name || s.sessionId);
      const sentData = trafficData.value.sessionsComparison.map(s => s.sent || 0);
      const receivedData = trafficData.value.sessionsComparison.map(s => s.received || 0);

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['No Devices'],
          datasets: [
            {
              label: 'Outgoing (Sent)',
              data: sentData.length > 0 ? sentData : [0],
              backgroundColor: 'rgba(16, 185, 129, 0.85)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 6,
              barPercentage: 0.6
            },
            {
              label: 'Incoming (Received)',
              data: receivedData.length > 0 ? receivedData : [0],
              backgroundColor: 'rgba(6, 182, 212, 0.85)',
              borderColor: '#06b6d4',
              borderWidth: 1,
              borderRadius: 6,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#111b21',
              borderColor: '#2a3942',
              borderWidth: 1,
              titleColor: '#fff',
              bodyColor: '#cbd5e1',
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: {
              grid: {
                color: '#2a3942',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: '#2a3942',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 },
                precision: 0
              }
            }
          }
        }
      });
    } else {
      // Timeline Mode (Daily Trend)
      const labels = trafficData.value.timeline.map(t => t.date);
      const sentData = trafficData.value.timeline.map(t => t.sent || 0);
      const receivedData = trafficData.value.timeline.map(t => t.received || 0);

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [
            {
              label: 'Outgoing (Sent)',
              data: sentData.length > 0 ? sentData : [0],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#10b981',
              pointRadius: 4,
              borderWidth: 2.5
            },
            {
              label: 'Incoming (Received)',
              data: receivedData.length > 0 ? receivedData : [0],
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#06b6d4',
              pointRadius: 4,
              borderWidth: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#111b21',
              borderColor: '#2a3942',
              borderWidth: 1,
              titleColor: '#fff',
              bodyColor: '#cbd5e1',
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: {
              grid: {
                color: '#2a3942',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: '#2a3942',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 },
                precision: 0
              }
            }
          }
        }
      });
    }
  });
};

const changeLogPage = (newPage) => {
  logPagination.value.page = newPage;
  fetchRecentLogs();
};

const setRange = (r) => {
  selectedRange.value = r;
  fetchAllReports();
};

const fetchAllReports = async () => {
  loading.value = true;
  await Promise.all([
    fetchSummary(),
    fetchDeviceReports(),
    fetchApiKeyReports(),
    fetchRecentLogs(),
    fetchTrafficChart()
  ]);
  loading.value = false;
};

// Formatting helpers
const formatDate = (d) => {
  if (!d) return 'Never / No data';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTime = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// ==================== EXPORT TO EXCEL (.XLSX) ====================

/**
 * Export currently active tab to .xlsx
 */
const exportCurrentTabXlsx = () => {
  const wb = XLSX.utils.book_new();

  if (activeTab.value === 'devices') {
    const data = [
      ['Device Name', 'Session ID', 'Phone Number', 'Status', 'Outgoing (Sent)', 'Incoming (Received)', 'Delivery Rate', 'API Calls', 'Last Activity'],
      ...filteredDevices.value.map(d => [
        d.name || '',
        d.sessionId || '',
        d.phoneNumber ? '+' + d.phoneNumber : '-',
        d.status,
        d.messages?.sent || 0,
        d.messages?.received || 0,
        d.messages?.deliveryRate || '100%',
        d.apiCalls || 0,
        d.lastActivity ? formatDate(d.lastActivity) : 'No data'
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Devices Usage');
    XLSX.writeFile(wb, `whatsapp_devices_report_${selectedRange.value}.xlsx`);
  } else if (activeTab.value === 'api-keys') {
    const data = [
      ['Key Name / Application', 'Token Preview', 'Owner', 'Total Hits', 'Success Rate', 'Client Errors (4xx)', 'Server Errors (5xx)', 'Avg Latency (ms)', 'Last Request'],
      ...filteredApiKeys.value.map(k => [
        k.name || '',
        k.tokenPreview || '',
        k.owner || '',
        k.totalRequests || 0,
        k.successRate || '100%',
        k.clientErrors || 0,
        k.serverErrors || 0,
        k.avgLatencyMs || 0,
        k.lastRequestAt ? formatDate(k.lastRequestAt) : 'Never'
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'API Keys Usage');
    XLSX.writeFile(wb, `whatsapp_apikeys_report_${selectedRange.value}.xlsx`);
  } else {
    const data = [
      ['Timestamp', 'Method', 'Endpoint', 'Status Code', 'Token Name', 'Target Device', 'Latency (ms)', 'Caller IP'],
      ...auditLogs.value.map(l => [
        formatTime(l.created_at),
        l.method,
        l.endpoint,
        l.status_code,
        l.token_name || 'Dashboard (JWT)',
        l.device_name || l.session_id || '-',
        l.response_time_ms || 0,
        l.ip_address || '127.0.0.1'
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    XLSX.writeFile(wb, `whatsapp_audit_logs_${selectedRange.value}.xlsx`);
  }
};

/**
 * Export Full 3-sheet Excel Workbook (.xlsx)
 */
const exportFullWorkbookXlsx = () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Devices
  const devicesData = [
    ['Device Name', 'Session ID', 'Phone Number', 'Status', 'Outgoing (Sent)', 'Incoming (Received)', 'Delivery Rate', 'API Calls', 'Last Activity'],
    ...deviceReports.value.map(d => [
      d.name || '',
      d.sessionId || '',
      d.phoneNumber ? '+' + d.phoneNumber : '-',
      d.status,
      d.messages?.sent || 0,
      d.messages?.received || 0,
      d.messages?.deliveryRate || '100%',
      d.apiCalls || 0,
      d.lastActivity ? formatDate(d.lastActivity) : 'No data'
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(devicesData), 'WhatsApp Devices');

  // Sheet 2: API Keys
  const keysData = [
    ['Key Name / Application', 'Token Preview', 'Owner', 'Total Hits', 'Success Rate', 'Client Errors (4xx)', 'Server Errors (5xx)', 'Avg Latency (ms)', 'Last Request'],
    ...apiKeyReports.value.map(k => [
      k.name || '',
      k.tokenPreview || '',
      k.owner || '',
      k.totalRequests || 0,
      k.successRate || '100%',
      k.clientErrors || 0,
      k.serverErrors || 0,
      k.avgLatencyMs || 0,
      k.lastRequestAt ? formatDate(k.lastRequestAt) : 'Never'
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(keysData), 'API Keys');

  // Sheet 3: Audit Logs
  const logsData = [
    ['Timestamp', 'Method', 'Endpoint', 'Status Code', 'Token Name', 'Target Device', 'Latency (ms)', 'Caller IP'],
    ...auditLogs.value.map(l => [
      formatTime(l.created_at),
      l.method,
      l.endpoint,
      l.status_code,
      l.token_name || 'Dashboard (JWT)',
      l.device_name || l.session_id || '-',
      l.response_time_ms || 0,
      l.ip_address || '127.0.0.1'
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logsData), 'Recent Audit Logs');

  XLSX.writeFile(wb, `whatsapp_gateway_full_analytics_${selectedRange.value}.xlsx`);
};

onMounted(() => {
  fetchAllReports();
});
</script>
