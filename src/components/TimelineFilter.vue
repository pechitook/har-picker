<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue';
import { useHarStore } from '../stores/harStore';
import {
  computeTicks,
  formatRangeLabel,
  formatTimestampAbsolute,
  offsetToRatio,
  ratioToTimestamp,
  presetLastNSeconds,
  parseEntryStart,
} from '../helpers/timeline.helpers';

const store = useHarStore();

const trackRef = ref<HTMLDivElement | null>(null);
const dragging = ref<'start' | 'end' | 'move' | null>(null);
const moveOffset = ref(0);

const bounds = computed(() => store.timelineBounds);
const range = computed(() => store.filterTimeRange);

const effectiveRange = computed(() => {
  const b = bounds.value;
  if (!b) return null;
  return range.value ?? { startMs: b.start, endMs: b.end };
});

const ticks = computed(() => {
  const b = bounds.value;
  if (!b) return [];
  return computeTicks(b);
});

const selectionStyle = computed(() => {
  const b = bounds.value;
  const r = effectiveRange.value;
  if (!b || !r) return { left: '0%', width: '100%' };
  const left = offsetToRatio(r.startMs, b) * 100;
  const width = offsetToRatio(r.endMs, b) * 100 - left;
  return {
    left: `${left}%`,
    width: `${Math.max(0, width)}%`,
  };
});

const isFiltered = computed(() => store.hasTimeFilter);
const rangeLabel = computed(() => {
  const b = bounds.value;
  const r = effectiveRange.value;
  if (!b || !r) return '';
  if (!isFiltered.value) return `${formatRangeLabel(r, b)} — all time`;
  return formatRangeLabel(r, b);
});

const absoluteLabel = computed(() => {
  const r = effectiveRange.value;
  if (!r) return '';
  return `${formatTimestampAbsolute(r.startMs)} → ${formatTimestampAbsolute(r.endMs)}`;
});

// Histogram buckets
const histogram = computed(() => {
  const b = bounds.value;
  const har = store.har;
  if (!b || !har) return [] as number[];
  const bucketCount = 64;
  const buckets = new Array<number>(bucketCount).fill(0);
  for (const e of har.log.entries) {
    const t = parseEntryStart(e);
    if (t === null) continue;
    const ratio = offsetToRatio(t, b);
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)));
    buckets[idx]!++;
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((c) => c / max);
});

function timestampFromClientX(clientX: number): number | null {
  const b = bounds.value;
  const track = trackRef.value;
  if (!b || !track) return null;
  const rect = track.getBoundingClientRect();
  if (rect.width === 0) return null;
  const ratio = (clientX - rect.left) / rect.width;
  return ratioToTimestamp(ratio, b);
}

function applyLast(n: number): void {
  const b = bounds.value;
  if (!b) return;
  store.setTimeRange(presetLastNSeconds(b, n));
}

function onHandleDown(handle: 'start' | 'end', e: PointerEvent): void {
  e.preventDefault();
  dragging.value = handle;
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onSelectionDown(e: PointerEvent): void {
  // Only if clicking the selection area but not a handle
  if ((e.target as HTMLElement).closest('.timeline-handle')) return;
  e.preventDefault();
  const b = bounds.value;
  const r = effectiveRange.value;
  if (!b || !r) return;
  const ts = timestampFromClientX(e.clientX);
  if (ts === null) return;
  const center = (r.startMs + r.endMs) / 2;
  moveOffset.value = ts - center;
  dragging.value = 'move';
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onTrackClick(e: MouseEvent): void {
  if (dragging.value) return;
  // Ignore if click on handles or selection (handled elsewhere)
  if ((e.target as HTMLElement).closest('.timeline-handle, .timeline-selection')) return;
  const ts = timestampFromClientX(e.clientX);
  const b = bounds.value;
  const r = effectiveRange.value;
  if (ts === null || !b || !r) return;
  const distToStart = Math.abs(ts - r.startMs);
  const distToEnd = Math.abs(ts - r.endMs);
  // Move closest edge to click position (preserves other edge unless it would invert)
  if (distToStart < distToEnd) {
    store.setTimeRange({ startMs: ts, endMs: r.endMs });
  } else {
    store.setTimeRange({ startMs: r.startMs, endMs: ts });
  }
}

function onPointerMove(e: PointerEvent): void {
  const b = bounds.value;
  const r = effectiveRange.value;
  if (!b || !r) return;
  const ts = timestampFromClientX(e.clientX);
  if (ts === null) return;

  if (dragging.value === 'start') {
    store.setTimeRange({ startMs: ts, endMs: r.endMs });
  } else if (dragging.value === 'end') {
    store.setTimeRange({ startMs: r.startMs, endMs: ts });
  } else if (dragging.value === 'move') {
    const width = r.endMs - r.startMs;
    let newCenter = ts - moveOffset.value;
    let newStart = newCenter - width / 2;
    let newEnd = newCenter + width / 2;
    // Clamp to bounds
    if (newStart < b.start) {
      newStart = b.start;
      newEnd = b.start + width;
    }
    if (newEnd > b.end) {
      newEnd = b.end;
      newStart = b.end - width;
    }
    store.setTimeRange({ startMs: newStart, endMs: newEnd });
  }
}

function onPointerUp(e: PointerEvent): void {
  dragging.value = null;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  try {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  } catch {
    // ignore
  }
}

function onHandleKeydown(handle: 'start' | 'end', e: KeyboardEvent): void {
  const b = bounds.value;
  const r = effectiveRange.value;
  if (!b || !r) return;
  const step = e.shiftKey ? 1000 : 100;
  let delta = 0;
  if (e.key === 'ArrowLeft') delta = -step;
  else if (e.key === 'ArrowRight') delta = step;
  else return;
  e.preventDefault();
  if (handle === 'start') {
    store.setTimeRange({ startMs: r.startMs + delta, endMs: r.endMs });
  } else {
    store.setTimeRange({ startMs: r.startMs, endMs: r.endMs + delta });
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});
</script>

<template>
  <div v-if="bounds" class="timeline">
    <div class="timeline-header">
      <div class="timeline-header-left">
        <span class="timeline-title">Timeline</span>
        <span class="timeline-range" :title="absoluteLabel">{{ rangeLabel }}</span>
      </div>
      <div class="timeline-actions">
        <button
          class="btn timeline-preset"
          :class="{ 'is-active': false }"
          :disabled="bounds.duration < 5000"
          title="Show only last 5 seconds"
          @click="applyLast(5)"
        >
          Last 5s
        </button>
        <button
          class="btn timeline-preset"
          :disabled="bounds.duration < 30000"
          title="Show only last 30 seconds"
          @click="applyLast(30)"
        >
          Last 30s
        </button>
        <button
          class="btn timeline-preset"
          :disabled="!isFiltered"
          title="Clear time filter — show all"
          @click="store.clearTimeFilter()"
        >
          All
        </button>
      </div>
    </div>

    <div
      ref="trackRef"
      class="timeline-track"
      @click="onTrackClick"
    >
      <div class="timeline-track-bg" aria-hidden="true">
        <div
          v-for="(h, i) in histogram"
          :key="i"
          class="timeline-hist-bar"
          :style="{ height: `${Math.max(4, h * 100)}%`, opacity: `${0.2 + h * 0.6}` }"
        />
      </div>

      <div class="timeline-dim timeline-dim-left" :style="{ width: selectionStyle.left }" aria-hidden="true" />
      <div class="timeline-dim timeline-dim-right" :style="{ left: `calc(${selectionStyle.left} + ${selectionStyle.width})`, right: '0' }" aria-hidden="true" />

      <div
        class="timeline-selection"
        :style="selectionStyle"
        @pointerdown="onSelectionDown"
      >
        <button
          class="timeline-handle timeline-handle-left"
          role="slider"
          :aria-label="'Start time'"
          :aria-valuenow="effectiveRange ? effectiveRange.startMs : 0"
          :aria-valuemin="bounds.start"
          :aria-valuemax="bounds.end"
          tabindex="0"
          @pointerdown="onHandleDown('start', $event)"
          @keydown="onHandleKeydown('start', $event)"
        >
          <span class="handle-grip" aria-hidden="true" />
        </button>
        <div class="timeline-selection-fill" aria-hidden="true" />
        <button
          class="timeline-handle timeline-handle-right"
          role="slider"
          :aria-label="'End time'"
          :aria-valuenow="effectiveRange ? effectiveRange.endMs : 0"
          :aria-valuemin="bounds.start"
          :aria-valuemax="bounds.end"
          tabindex="0"
          @pointerdown="onHandleDown('end', $event)"
          @keydown="onHandleKeydown('end', $event)"
        >
          <span class="handle-grip" aria-hidden="true" />
        </button>
      </div>

      <div class="timeline-ticks" aria-hidden="true">
        <div
          v-for="tick in ticks"
          :key="tick.label + tick.ratio"
          class="timeline-tick"
          :style="{ left: `${tick.ratio * 100}%` }"
        >
          <span class="tick-line" />
          <span class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
    </div>

    <div v-if="isFiltered" class="timeline-hint">
      <span>{{ store.filteredIndices.length }} requests in selected window</span>
      <button class="btn btn-ghost timeline-clear" @click="store.clearTimeFilter()">Clear time filter</button>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 24px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.timeline-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.timeline-range {
  font-size: 0.82rem;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.timeline-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.timeline-preset {
  padding: 4px 10px;
  font-size: 0.78rem;
  border-radius: 999px;
}

.timeline-preset:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.timeline-track {
  position: relative;
  height: 44px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  touch-action: none;
}

.timeline-track-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: end;
  gap: 1px;
  padding: 0 1px 14px;
  pointer-events: none;
}

.timeline-hist-bar {
  flex: 1;
  background: var(--color-text-soft);
  border-radius: 1px 1px 0 0;
  min-width: 1px;
  transition: height 0.15s;
}

.timeline-dim {
  position: absolute;
  top: 0;
  bottom: 14px;
  background: color-mix(in srgb, var(--color-bg) 62%, transparent);
  backdrop-filter: saturate(80%) blur(0.5px);
  pointer-events: none;
  transition: width 0.08s, left 0.08s;
}

.timeline-dim-left {
  left: 0;
}

.timeline-dim-right {
  position: absolute;
  top: 0;
  bottom: 14px;
  right: 0;
}

.timeline-selection {
  position: absolute;
  top: 0;
  bottom: 14px;
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  border-left: 1.5px solid var(--color-primary);
  border-right: 1.5px solid var(--color-primary);
  display: flex;
  align-items: stretch;
  cursor: grab;
  transition: left 0.08s, width 0.08s;
}

.timeline-selection:active {
  cursor: grabbing;
}

.timeline-selection-fill {
  flex: 1;
  min-width: 0;
}

.timeline-handle {
  width: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  border: none;
  cursor: col-resize;
  padding: 0;
  color: #fff;
  transition: background 0.12s, width 0.12s;
  touch-action: none;
}

.timeline-handle:hover,
.timeline-handle:focus-visible {
  background: var(--color-primary-hover);
  outline: none;
}

.timeline-handle:focus-visible {
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary);
  z-index: 1;
}

.timeline-handle-left {
  border-radius: 0;
  margin-left: -1px;
}

.timeline-handle-right {
  border-radius: 0;
  margin-right: -1px;
}

.handle-grip {
  width: 2px;
  height: 14px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  position: relative;
}

.handle-grip::before,
.handle-grip::after {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  height: 2px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1px;
  display: none;
}

.timeline-ticks {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 14px;
  pointer-events: none;
}

.timeline-tick {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.timeline-tick:first-child {
  transform: translateX(0);
  align-items: flex-start;
  padding-left: 6px;
}

.timeline-tick:last-child {
  transform: translateX(-100%);
  align-items: flex-end;
  padding-right: 6px;
}

.tick-line {
  width: 1px;
  height: 4px;
  background: var(--color-border-strong);
}

.tick-label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  padding-bottom: 2px;
}

.timeline-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.timeline-clear {
  font-size: 0.78rem;
  padding: 2px 8px;
  color: var(--color-primary);
}

@media (max-width: 700px) {
  .timeline {
    padding: 10px 16px 12px;
  }

  .timeline-header {
    flex-direction: column;
    align-items: stretch;
  }

  .timeline-range {
    white-space: normal;
  }
}
</style>
