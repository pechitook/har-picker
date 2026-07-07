<script setup lang="ts">
import { useHarStore } from './stores/harStore';
import PasteDropZone from './components/PasteDropZone.vue';
import Toolbar from './components/Toolbar.vue';
import StrippingPanel from './components/StrippingPanel.vue';
import EntryList from './components/EntryList.vue';
import PreviewPanel from './components/PreviewPanel.vue';

const store = useHarStore();
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-brand">
        <div class="app-logo" aria-hidden="true">HP</div>
        <div class="app-titles">
          <h1 class="app-title">HAR Picker</h1>
          <p class="app-subtitle">Select what to share with your AI agent</p>
        </div>
      </div>
      <div class="app-header-right">
        <div v-if="store.har" class="app-counter" :title="`${store.selectedCount} of ${store.har.log.entries.length} entries selected`">
          <span class="app-counter-value">{{ store.selectedCount }}</span>
          <span class="app-counter-sep">/</span>
          <span class="app-counter-total">{{ store.har.log.entries.length }}</span>
          <span class="app-counter-label">selected</span>
        </div>
        <button
          v-if="store.har"
          class="btn btn-ghost"
          @click="store.clear()"
        >
          Clear
        </button>
      </div>
    </header>

    <main class="app-main">
      <PasteDropZone v-if="!store.har" />

      <template v-else>
        <Toolbar />
        <div class="app-content">
          <StrippingPanel class="app-stripping" />
          <section class="app-list">
            <EntryList />
          </section>
          <PreviewPanel class="app-preview" />
        </div>
      </template>
    </main>
  </div>
</template>

<style>
:root {
  --color-bg: #F8F9FB;
  --color-surface: #FFFFFF;
  --color-surface-2: #F1F5F9;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-text-soft: #94A3B8;
  --color-border: #E2E8F0;
  --color-border-strong: #CBD5E1;
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-primary-soft: #DBEAFE;
  --color-primary-soft-hover: #BFDBFE;
  --color-success: #10B981;
  --color-success-soft: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-soft: #FEF3C7;
  --color-danger: #EF4444;
  --color-danger-soft: #FEE2E2;
  --color-method-get: #10B981;
  --color-method-post: #3B82F6;
  --color-method-put: #F59E0B;
  --color-method-patch: #F59E0B;
  --color-method-delete: #EF4444;
  --color-method-other: #64748B;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.02);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05);
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0B0F1A;
    --color-surface: #131826;
    --color-surface-2: #1B2230;
    --color-text: #E2E8F0;
    --color-text-muted: #94A3B8;
    --color-text-soft: #64748B;
    --color-border: #232B3B;
    --color-border-strong: #334155;
    --color-primary: #60A5FA;
    --color-primary-hover: #93C5FD;
    --color-primary-soft: #1E3A8A;
    --color-primary-soft-hover: #1E40AF;
    --color-success: #34D399;
    --color-success-soft: #064E3B;
    --color-warning: #FBBF24;
    --color-warning-soft: #78350F;
    --color-danger: #F87171;
    --color-danger-soft: #7F1D1D;
    --color-method-get: #34D399;
    --color-method-post: #60A5FA;
    --color-method-put: #FBBF24;
    --color-method-patch: #FBBF24;
    --color-method-delete: #F87171;
    --color-method-other: #94A3B8;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
  }
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
  font-size: 14px;
}

#app {
  min-height: 100vh;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  font-family: inherit;
  white-space: nowrap;
  user-select: none;
}

.btn:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-2);
}

.btn:active {
  transform: translateY(0.5px);
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.input::placeholder {
  color: var(--color-text-soft);
}
</style>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.app-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.app-titles {
  min-width: 0;
}

.app-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.app-subtitle {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin: 2px 0 0;
  line-height: 1.2;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.app-counter {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 12px;
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.app-counter-sep {
  color: var(--color-text-soft);
  font-weight: 400;
}

.app-counter-total {
  color: var(--color-text-muted);
  font-weight: 500;
}

.app-counter-label {
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.75rem;
  margin-left: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: inherit;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.app-content {
  flex: 1;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 340px;
  gap: 16px;
  padding: 16px 24px 24px;
  min-height: 0;
  align-items: start;
}

.app-stripping {
  align-self: start;
}

.app-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  height: 100%;
}

.app-preview {
  align-self: start;
}

@media (max-width: 1100px) {
  .app-content {
    grid-template-columns: 220px minmax(0, 1fr) 300px;
  }
}

@media (max-width: 900px) {
  .app-content {
    grid-template-columns: 1fr;
  }

  .app-header {
    padding: 12px 16px;
  }

  .app-content {
    padding: 12px 16px 16px;
  }

  .app-stripping,
  .app-preview {
    position: static;
    max-height: none;
  }
}
</style>
