<script setup lang="ts">
import { computed } from 'vue';
import { useHarStore } from '../stores/harStore';
import EntryItem from './EntryItem.vue';

const store = useHarStore();

const entries = computed(() => {
  if (!store.har) return [];
  return store.filteredIndices.map((i) => ({
    entry: store.har!.log.entries[i]!,
    index: i,
    type: store.entryTypes[i] ?? 'other',
  }));
});

const total = computed(() => store.har?.log.entries.length ?? 0);
const visible = computed(() => entries.value.length);
</script>

<template>
  <div class="entry-list" v-if="store.har">
    <div class="entry-list-header">
      <span class="entry-list-title">Requests</span>
      <span class="entry-list-count">
        <strong>{{ visible }}</strong>
        <span class="entry-list-count-sep">of</span>
        <span>{{ total }}</span>
        <span class="entry-list-count-label">visible</span>
      </span>
    </div>

    <div class="entry-list-scroll">
      <div v-if="entries.length === 0" class="entry-list-empty">
        <p class="entry-list-empty-title">No requests match the current filters.</p>
        <p class="entry-list-empty-hint">Adjust type pills, status, or search to see entries.</p>
      </div>
      <div v-else class="entry-list-items">
        <EntryItem
          v-for="item in entries"
          :key="item.index"
          :entry="item.entry"
          :index="item.index"
          :type="item.type"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.entry-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.entry-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.entry-list-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.entry-list-count {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.entry-list-count strong {
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.85rem;
}

.entry-list-count-sep {
  color: var(--color-text-soft);
  margin: 0 2px;
}

.entry-list-count-label {
  margin-left: 6px;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  font-family: inherit;
}

.entry-list-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.entry-list-scroll::-webkit-scrollbar {
  width: 10px;
}

.entry-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.entry-list-scroll::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 5px;
  border: 2px solid var(--color-surface);
}

.entry-list-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-soft);
}

.entry-list-items {
  display: flex;
  flex-direction: column;
}

.entry-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  color: var(--color-text-muted);
  gap: 6px;
}

.entry-list-empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.entry-list-empty-hint {
  font-size: 0.85rem;
  margin: 0;
}
</style>
