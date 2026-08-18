<template>
  <span :class="badgeClass" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200">
    <span :class="dotClass" class="w-1.5 h-1.5 rounded-full animate-pulse"></span>
    {{ labelText }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    default: 'disconnected'
  },
  isLive: {
    type: Boolean,
    default: false
  }
});

const labelText = computed(() => {
  if (props.isLive || props.status === 'connected') return 'Online';
  if (props.status === 'qr_ready') return 'QR Ready';
  if (props.status === 'connecting') return 'Connecting';
  if (props.status === 'logged_out') return 'Logged Out';
  return 'Disconnected';
});

const badgeClass = computed(() => {
  if (props.isLive || props.status === 'connected') {
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }
  if (props.status === 'qr_ready') {
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  }
  if (props.status === 'connecting') {
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  }
  return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
});

const dotClass = computed(() => {
  if (props.isLive || props.status === 'connected') return 'bg-emerald-400';
  if (props.status === 'qr_ready') return 'bg-amber-400';
  if (props.status === 'connecting') return 'bg-blue-400';
  return 'bg-rose-400';
});
</script>
