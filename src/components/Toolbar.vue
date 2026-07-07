<script setup lang="ts">
import { computed } from 'vue';
import { useHarStore } from '../stores/harStore';
import type { ResourceType } from '../types/Har';
import type { FilterStatusRange } from '../types/Config';

const store = useHarStore();

const typePills: Array<{ type: ResourceType; label: string }> = [
  { type: 'xhr', label: 'XHR' },
  { type: 'document', label: 'Document' },
  { type: 'script', label: 'Script' },
  { type: 'stylesheet', label: 'Stylesheet' },
  { type: 'image', label: 'Image' },
  { type: 'media', label: 'Media' },
  { type: 'font', label: 'Font' },
  { type: 'other', label: 'Other' },
];

const statusOptions: Array<{ value: FilterStatusRange; label: string }> = [
  { value: 'all', label: 'All' },
  { value: '2xx', label: '2xx' },
  { value: '3xx', label: '3xx' },
  { value: '4xx', label: '4xx' },
  { value: '5xx', label: '5xx' },
];

const hasActiveFilters = computed(() => {
  return (
    store.filterTypes.size > 0 ||
    store.filterStatusRange !== 'all' ||
    store.filterSearch.trim().length > 0
  );
});

function toggleType(type: ResourceType): void {
  const next = new Set(store.filterTypes);
  if (next.has(type)) {
    next.delete(type);
  } else {
    next.add(type);
  }
  store.setFilterTypes(next);
}

function clearFilters(): void {
  store.setFilterTypes(new Set());
  store.setFilterSearch('');
  store.setFilterStatusRange('all');
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-row toolbar-row-main">
      <div class="toolbar-group">
        <button class="btn" @click="store.selectAll()">Select all</button>
        <button class="btn" @click="store.deselectAll()">Deselect all</button>
      </div>

      <div class="toolbar-search">
        <svg class="toolbar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="search"
          class="input toolbar-search-input"
          placeholder="Filter by URL…"
          :value="store.filterSearch"
          @input="store.setFilterSearch(($event.target as HTMLInputElement).value)"
        />
      </div>

      <button
        v-if="hasActiveFilters"
        class="btn btn-ghost toolbar-clear"
        @click="clearFilters"
      >
        Clear filters
      </button>
    </div>

    <div class="toolbar-row toolbar-row-filters">
      <div class="toolbar-section">
        <span class="toolbar-label">Type</span>
        <div class="pill-group">
          <button
            v-for="pill in typePills"
            :key="pill.type"
            class="pill"
            :class="{ 'is-active': store.filterTypes.has(pill.type) }"
            @click="toggleType(pill.type)"
            :aria-pressed="store.filterTypes.has(pill.type)"
          >
            {{ pill.label }}
          </button>
        </div>
      </div>

      <div class="toolbar-divider" aria-hidden="true"></div>

      <div class="toolbar-section">
        <span class="toolbar-label">Status</span>
        <div class="pill-group pill-group-status">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="pill pill-status"
            :class="{ 'is-active': store.filterStatusRange === opt.value }"
            @click="store.setFilterStatusRange(opt.value)"
            :aria-pressed="store.filterStatusRange === opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  position: sticky;
  top: 65px;
  z-index: 5;
  backdrop-filter: saturate(120%) blur(4px);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-row-main {
  gap: 12px;
}

.toolbar-group {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.toolbar-search {
  position: relative;
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
}

.toolbar-search-icon {
  position: absolute;
  left: 10px;
  color: var(--color-text-soft);
  pointer-events: none;
}

.toolbar-search-input {
  padding-left: 32px;
}

.toolbar-clear {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.toolbar-row-filters {
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toolbar-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  user-select: none;
}

.pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pill.is-active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.pill.is-active:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: #fff;
}

.pill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.pill-group-status {
  background: var(--color-surface-2);
  padding: 2px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
}

.pill-group-status .pill {
  border: none;
  background: transparent;
  padding: 3px 10px;
}

.pill-group-status .pill:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.pill-group-status .pill.is-active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.pill-group-status .pill.is-active:hover {
  color: #fff;
  background: var(--color-primary-hover);
}

.toolbar-divider {
  width: 1px;
  align-self: stretch;
  background: var(--color-border);
  margin: 2px 0;
}

@media (max-width: 700px) {
  .toolbar {
    padding: 10px 16px;
  }

  .toolbar-row-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .toolbar-divider {
    display: none;
  }
}
</style>
