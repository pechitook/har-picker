<script setup lang="ts">
import { ref } from 'vue';
import { useHarStore } from '../stores/harStore';
import { formatBytes } from '../utils/format';

const store = useHarStore();
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

async function copyToClipboard(): Promise<void> {
  if (store.charCount === 0) return;
  try {
    await navigator.clipboard.writeText(store.compressedOutput);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = store.compressedOutput;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <aside class="preview" v-if="store.har">
    <div class="preview-header">
      <h3 class="preview-title">Output</h3>
      <span class="preview-subtitle">Compact JSON for AI</span>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-value">{{ store.effectiveSelectedCount.toLocaleString('en-US') }}</span>
        <span class="stat-label">Entries</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ store.charCount.toLocaleString('en-US') }}</span>
        <span class="stat-label">Chars</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ store.tokenCount.toLocaleString('en-US') }}</span>
        <span class="stat-label">Tokens</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ formatBytes(store.charCount) }}</span>
        <span class="stat-label">Size</span>
      </div>
    </div>

    <div class="preview-sample">
      <div class="preview-sample-header">
        <span>Sample</span>
        <span class="preview-sample-info">first 500 chars</span>
      </div>
      <pre class="preview-code"><code>{{ store.previewSample || '(nothing selected — pick entries above)' }}</code></pre>
    </div>

    <button
      class="btn btn-primary preview-copy"
      :class="{ 'is-copied': copied }"
      :disabled="store.effectiveSelectedCount === 0"
      @click="copyToClipboard"
    >
      <svg v-if="copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12l5 5L20 7"/>
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <span>{{ copied ? 'Copied to clipboard' : 'Copy to clipboard' }}</span>
    </button>
  </aside>
</template>

<style scoped>
.preview {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 180px;
  max-height: calc(100vh - 200px);
  min-height: 0;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.preview-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
}

.stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.preview-sample {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  flex: 1;
}

.preview-sample-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.preview-sample-header > span:first-child {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.preview-sample-info {
  font-size: 0.7rem;
  color: var(--color-text-soft);
}

.preview-code {
  flex: 1;
  min-height: 120px;
  max-height: 280px;
  overflow: auto;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.preview-code::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-code::-webkit-scrollbar-track {
  background: transparent;
}

.preview-code::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 4px;
}

.preview-copy {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 600;
}

.preview-copy:disabled {
  background: var(--color-surface-2);
  color: var(--color-text-soft);
  border-color: var(--color-border);
  cursor: not-allowed;
}

.preview-copy.is-copied {
  background: var(--color-success);
  border-color: var(--color-success);
}

.preview-copy.is-copied:hover {
  background: var(--color-success);
  border-color: var(--color-success);
}

@media (max-width: 900px) {
  .preview {
    position: static;
    max-height: none;
  }
}

</style>
