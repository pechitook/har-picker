<script setup lang="ts">
import { computed } from 'vue';
import { useHarStore } from '../stores/harStore';
import { COMMON_HEADERS, ESSENTIAL_HEADERS } from '../types/Config';

const store = useHarStore();

const truncateOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'No limit' },
  { value: '20', label: '20 chars' },
  { value: '50', label: '50 chars' },
  { value: '100', label: '100 chars' },
  { value: '200', label: '200 chars' },
  { value: '256', label: '256 chars' },
  { value: '512', label: '512 chars' },
  { value: '1024', label: '1K chars' },
  { value: '2048', label: '2K chars' },
  { value: '5120', label: '5K chars' },
  { value: '10240', label: '10K chars' },
];

const totalHeaders = COMMON_HEADERS.length;

const isHeaderWhitelist = computed(() => store.globalStrip.headerMode === 'whitelist');

const selectedHeaderCount = computed(() => {
  if (store.globalStrip.headerMode === 'all') return totalHeaders;
  return store.globalStrip.headerWhitelist.size;
});

const isEssentialsActive = computed(() => {
  if (!isHeaderWhitelist.value) return false;
  const wl = store.globalStrip.headerWhitelist;
  return (
    wl.size === ESSENTIAL_HEADERS.length &&
    ESSENTIAL_HEADERS.every((h) => wl.has(h))
  );
});

const isAllActive = computed(() => store.globalStrip.headerMode === 'all');

const isNoneActive = computed(
  () => isHeaderWhitelist.value && selectedHeaderCount.value === 0
);

const headerStatusLabel = computed(() => {
  if (store.globalStrip.headerMode === 'all') return `all ${totalHeaders} kept`;
  const n = store.globalStrip.headerWhitelist.size;
  if (n === 0) return 'all stripped';
  return `${n} of ${totalHeaders} kept`;
});

function isHeaderSelected(name: string): boolean {
  if (store.globalStrip.headerMode === 'all') return true;
  return store.globalStrip.headerWhitelist.has(name);
}

function onTruncateChange(e: Event): void {
  const v = (e.target as HTMLSelectElement).value;
  store.setGlobalStrip({ truncateBodyChars: v ? Number(v) : null });
}

function applyEssentials(): void {
  store.applyHeaderPreset(ESSENTIAL_HEADERS);
}

function applyAllHeaders(): void {
  store.setHeaderMode('all');
}

function applyNoHeaders(): void {
  store.applyHeaderPreset([]);
}

function onToggleHeader(name: string): void {
  if (store.globalStrip.headerMode === 'all') {
    const next = new Set(COMMON_HEADERS.map((h) => h.toLowerCase()));
    const lower = name.toLowerCase();
    if (next.has(lower)) next.delete(lower);
    store.setGlobalStrip({
      headerMode: 'whitelist',
      headerWhitelist: next,
    });
  } else {
    store.toggleHeader(name);
  }
}
</script>

<template>
  <aside class="stripping-panel">
    <header class="stripping-header">
      <h2 class="stripping-title">Stripping</h2>
      <span class="stripping-sub">applies to all selected entries</span>
    </header>

    <div class="stripping-body">
      <section class="strip-block">
        <span class="strip-block-label">Cookies</span>
        <label class="strip-check">
          <input
            type="checkbox"
            :checked="store.globalStrip.stripCookieValues"
            :disabled="store.globalStrip.stripCookieNames"
            @change="store.setGlobalStrip({ stripCookieValues: ($event.target as HTMLInputElement).checked })"
          />
          <span>Strip values</span>
        </label>
        <label class="strip-check">
          <input
            type="checkbox"
            :checked="store.globalStrip.stripCookieNames"
            @change="store.setGlobalStrip({ stripCookieNames: ($event.target as HTMLInputElement).checked })"
          />
          <span>Strip names entirely</span>
        </label>
      </section>

      <section class="strip-block">
        <span class="strip-block-label">URL</span>
        <label class="strip-check">
          <input
            type="checkbox"
            :checked="store.globalStrip.removeQueryStrings"
            @change="store.setGlobalStrip({ removeQueryStrings: ($event.target as HTMLInputElement).checked })"
          />
          <span>Remove query strings</span>
        </label>
      </section>

      <section class="strip-block">
        <span class="strip-block-label">Response body</span>
        <select
          class="input strip-select"
          :value="store.globalStrip.truncateBodyChars?.toString() ?? ''"
          @change="onTruncateChange"
        >
          <option
            v-for="opt in truncateOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </section>

      <section class="strip-block strip-block-headers">
        <div class="strip-headers-head">
          <span class="strip-block-label">Headers</span>
          <span class="strip-headers-mode">{{ headerStatusLabel }}</span>
        </div>
        <div class="strip-headers-actions">
          <button
            class="btn btn-sm strip-preset"
            :class="{ 'is-active': isEssentialsActive }"
            @click="applyEssentials"
          >
            Essentials
          </button>
          <button
            class="btn btn-sm strip-preset"
            :class="{ 'is-active': isAllActive }"
            @click="applyAllHeaders"
          >
            All
          </button>
          <button
            class="btn btn-sm strip-preset"
            :class="{ 'is-active': isNoneActive }"
            @click="applyNoHeaders"
          >
            None
          </button>
        </div>
        <div class="strip-headers-list" role="group" aria-label="Headers to keep">
          <button
            v-for="h in COMMON_HEADERS"
            :key="h"
            class="header-pill"
            :class="{ 'is-active': isHeaderSelected(h) }"
            :aria-pressed="isHeaderSelected(h)"
            :title="`${h} — click to toggle keep`"
            @click="onToggleHeader(h)"
          >
            <svg
              v-if="isHeaderSelected(h)"
              class="header-pill-check"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12l5 5L20 7"/>
            </svg>
            <span class="header-pill-name">{{ h }}</span>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.stripping-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  min-height: 0;
  align-self: start;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
}

.stripping-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.stripping-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text);
  margin: 0;
}

.stripping-sub {
  font-size: 0.7rem;
  color: var(--color-text-soft);
}

.stripping-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  min-height: 0;
}

.stripping-body::-webkit-scrollbar {
  width: 8px;
}

.stripping-body::-webkit-scrollbar-track {
  background: transparent;
}

.stripping-body::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 4px;
}

.strip-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.strip-block-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.strip-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--color-text);
  cursor: pointer;
  padding: 2px 0;
  user-select: none;
}

.strip-check input[type='checkbox'] {
  appearance: none;
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--color-border-strong);
  border-radius: 3px;
  background: var(--color-surface);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s, opacity 0.12s;
  margin: 0;
}

.strip-check input[type='checkbox']:not(:disabled):hover {
  border-color: var(--color-primary);
}

.strip-check input[type='checkbox']:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.strip-check input[type='checkbox']:checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0.5px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.strip-check input[type='checkbox']:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.strip-select {
  padding: 5px 8px;
  font-size: 0.82rem;
  cursor: pointer;
}

.strip-block-headers {
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.strip-headers-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.strip-headers-mode {
  font-size: 0.7rem;
  color: var(--color-text-soft);
  font-variant-numeric: tabular-nums;
}

.strip-headers-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.strip-preset {
  font-size: 0.74rem;
  padding: 3px 8px;
}

.strip-preset.is-active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.strip-headers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.header-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px 2px 5px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 500;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  user-select: none;
}

.header-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
}

.header-pill.is-active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.header-pill.is-active:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.header-pill-check {
  flex-shrink: 0;
}

.header-pill-name {
  white-space: nowrap;
}
</style>
