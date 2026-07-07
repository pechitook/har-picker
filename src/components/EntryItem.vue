<script setup lang="ts">
import { computed } from 'vue';
import type { HarEntry, ResourceType } from '../types/Har';
import type { FieldKey } from '../types/Config';
import { ALL_FIELDS } from '../types/Config';
import { useHarStore } from '../stores/harStore';
import { formatBytes } from '../utils/format';

const props = defineProps<{
  entry: HarEntry;
  index: number;
  type: ResourceType;
}>();

const store = useHarStore();
const cfg = computed(() => store.configs.get(props.index));

const FIELD_LABELS: Record<FieldKey, string> = {
  url: 'URL',
  method: 'Method',
  status: 'Status',
  requestHeaders: 'Request headers',
  requestCookies: 'Request cookies',
  requestBody: 'Request body',
  responseHeaders: 'Response headers',
  responseCookies: 'Response cookies',
  responseBody: 'Response body',
  timing: 'Timing',
};

const methodColors: Record<string, string> = {
  GET: 'var(--color-method-get)',
  POST: 'var(--color-method-post)',
  PUT: 'var(--color-method-put)',
  PATCH: 'var(--color-method-patch)',
  DELETE: 'var(--color-method-delete)',
  HEAD: 'var(--color-method-other)',
  OPTIONS: 'var(--color-method-other)',
};

const methodColor = computed(() => {
  const m = props.entry.request.method.toUpperCase();
  return methodColors[m] ?? 'var(--color-method-other)';
});

const statusColor = computed(() => {
  const s = props.entry.response.status;
  if (s >= 200 && s < 300) return 'var(--color-success)';
  if (s >= 300 && s < 400) return 'var(--color-primary)';
  if (s >= 400 && s < 500) return 'var(--color-warning)';
  if (s >= 500) return 'var(--color-danger)';
  return 'var(--color-text-muted)';
});

const responseSize = computed(
  () => props.entry.response.bodySize || props.entry.response.content.size || 0
);
const totalTime = computed(() => Math.round(props.entry.time));

const displayUrl = computed(() => {
  const u = props.entry.request.url;
  return u.length > 120 ? u.slice(0, 117) + '…' : u;
});

const selected = computed(() => cfg.value?.selected ?? false);

function onToggleSelect(e: Event): void {
  e.stopPropagation();
  store.toggleEntry(props.index);
}

function onToggleField(key: FieldKey, e: Event): void {
  e.stopPropagation();
  store.setField(props.index, key, (e.target as HTMLInputElement).checked);
}
</script>

<template>
  <details
    class="entry"
    :class="{ 'is-selected': selected }"
  >
    <summary class="entry-main" @click.stop>
      <label
        class="entry-check"
        :title="selected ? 'Deselect entry' : 'Select entry'"
        @click.stop
      >
        <input
          type="checkbox"
          :checked="selected"
          @change="onToggleSelect"
        />
        <span class="entry-check-box" aria-hidden="true">
          <svg v-if="selected" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12l5 5L20 7"/>
          </svg>
        </span>
      </label>

      <span class="entry-method" :style="{ background: methodColor }">
        {{ entry.request.method }}
      </span>

      <span class="entry-status" :style="{ color: statusColor }">
        {{ entry.response.status }}
      </span>

      <span class="entry-url" :title="entry.request.url">{{ displayUrl }}</span>

      <span class="entry-type">{{ type }}</span>

      <span class="entry-size" :title="`${responseSize} bytes response`">
        {{ formatBytes(responseSize) }}
      </span>

      <span class="entry-time" :title="`${totalTime}ms total`">
        {{ totalTime }}<span class="entry-time-unit">ms</span>
      </span>

      <span class="entry-expand-toggle" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>
    </summary>

    <div class="entry-fields">
      <div class="entry-fields-label">Include in output</div>
      <div class="field-grid">
        <label
          v-for="key in ALL_FIELDS"
          :key="key"
          class="field-row"
          @click.stop
        >
          <input
            type="checkbox"
            :checked="cfg?.fields[key] ?? true"
            @change="(e) => onToggleField(key, e)"
          />
          <span>{{ FIELD_LABELS[key] }}</span>
        </label>
      </div>
    </div>
  </details>
</template>

<style scoped>
.entry {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: background 0.12s;
  list-style: none;
}

.entry::-webkit-details-marker {
  display: none;
}

.entry:last-child {
  border-bottom: none;
}

.entry:hover {
  background: var(--color-surface-2);
}

.entry.is-selected {
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
}

.entry.is-selected:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
}

.entry[open] {
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
}

.entry-main {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  min-width: 0;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.entry-main::-webkit-details-marker {
  display: none;
}

.entry-main:hover {
  background: var(--color-surface-2);
}

.entry[open] > .entry-main {
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface));
  border-bottom: 1px solid var(--color-border);
}

.entry-check {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  padding: 2px;
  position: relative;
}

.entry-check input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.entry-check-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--color-border-strong);
  border-radius: 4px;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 0.12s, border-color 0.12s;
  flex-shrink: 0;
}

.entry-check:hover .entry-check-box {
  border-color: var(--color-primary);
}

.entry-check input:checked + .entry-check-box {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.entry-check input:focus-visible + .entry-check-box {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.entry-method {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 4px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 50px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  font-family: var(--font-mono);
}

.entry-status {
  font-weight: 600;
  font-size: 0.82rem;
  min-width: 32px;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
  flex-shrink: 0;
  text-align: right;
}

.entry-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.entry-type {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  background: var(--color-surface-2);
  padding: 2px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
  flex-shrink: 0;
}

.entry-size {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  min-width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.entry-time {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  min-width: 56px;
  text-align: right;
  flex-shrink: 0;
}

.entry-time-unit {
  margin-left: 1px;
  color: var(--color-text-soft);
  font-size: 0.7rem;
}

.entry-expand-toggle {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s, transform 0.2s;
}

.entry[open] .entry-expand-toggle {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: rotate(180deg);
}

.entry-main:hover .entry-expand-toggle {
  color: var(--color-text);
}

.entry[open] .entry-main:hover .entry-expand-toggle {
  color: var(--color-primary);
}

.entry-fields {
  background: var(--color-surface-2);
  border-top: 1px solid var(--color-border);
  padding: 10px 16px 12px 44px;
}

.entry-fields-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 2px 12px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--color-text);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  user-select: none;
  transition: background 0.12s;
}

.field-row:hover {
  background: var(--color-surface);
}

.field-row input[type='checkbox'] {
  appearance: none;
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--color-border-strong);
  border-radius: 3px;
  background: var(--color-surface);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;
}

.field-row input[type='checkbox']:hover {
  border-color: var(--color-primary);
}

.field-row input[type='checkbox']:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.field-row input[type='checkbox']:checked::after {
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
</style>
