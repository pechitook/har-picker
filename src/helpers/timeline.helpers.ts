import type { Har, HarEntry } from '../types/Har';

export interface TimelineBounds {
  start: number;
  end: number;
  duration: number;
}

export interface TimeRange {
  startMs: number;
  endMs: number;
}

export function parseEntryStart(entry: HarEntry): number | null {
  const t = Date.parse(entry.startedDateTime);
  return Number.isNaN(t) ? null : t;
}

export function computeTimelineBounds(har: Har): TimelineBounds | null {
  if (har.log.entries.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  let validCount = 0;
  for (const e of har.log.entries) {
    const t = parseEntryStart(e);
    if (t === null) continue;
    validCount++;
    if (t < min) min = t;
    const end = t + Math.max(0, e.time || 0);
    if (end > max) max = end;
  }
  if (validCount === 0) return null;
  // If all entries have ~0 time and min==max, expand by 1s to allow UI to render
  if (max <= min) max = min + 1000;
  return { start: min, end: max, duration: max - min };
}

export function clampRange(range: TimeRange, bounds: TimelineBounds): TimeRange {
  let startMs = Math.max(bounds.start, Math.min(bounds.end, range.startMs));
  let endMs = Math.max(bounds.start, Math.min(bounds.end, range.endMs));
  if (startMs > endMs) {
    const tmp = startMs;
    startMs = endMs;
    endMs = tmp;
  }
  // Enforce minimum window of 50ms
  const minWindow = 50;
  if (endMs - startMs < minWindow) {
    // Expand around center if possible
    const center = (startMs + endMs) / 2;
    startMs = Math.max(bounds.start, center - minWindow / 2);
    endMs = Math.min(bounds.end, center + minWindow / 2);
    if (endMs - startMs < minWindow) {
      if (startMs === bounds.start) endMs = Math.min(bounds.end, startMs + minWindow);
      else if (endMs === bounds.end) startMs = Math.max(bounds.start, endMs - minWindow);
    }
  }
  return { startMs, endMs };
}

export function offsetToRatio(timestampMs: number, bounds: TimelineBounds): number {
  if (bounds.duration === 0) return 0;
  return (timestampMs - bounds.start) / bounds.duration;
}

export function ratioToTimestamp(ratio: number, bounds: TimelineBounds): number {
  const clamped = Math.max(0, Math.min(1, ratio));
  return bounds.start + clamped * bounds.duration;
}

export function formatTimelineTickDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const sec = ms / 1000;
  if (sec < 60) {
    return sec < 10 ? `${sec.toFixed(1)}s` : `${Math.round(sec)}s`;
  }
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function formatTimestampRelative(timestampMs: number, bounds: TimelineBounds): string {
  const offset = timestampMs - bounds.start;
  return formatTimelineTickDuration(offset);
}

export function formatTimestampAbsolute(timestampMs: number): string {
  const d = new Date(timestampMs);
  return d.toLocaleTimeString();
}

export function formatRangeLabel(range: TimeRange | null, bounds: TimelineBounds | null): string {
  if (!range || !bounds) return '';
  const startOff = range.startMs - bounds.start;
  const endOff = range.endMs - bounds.start;
  const windowMs = range.endMs - range.startMs;
  return `${formatTimelineTickDuration(startOff)} – ${formatTimelineTickDuration(endOff)} (${formatTimelineTickDuration(windowMs)} window)`;
}

export function presetLastNSeconds(bounds: TimelineBounds, n: number): TimeRange {
  const windowMs = n * 1000;
  const startMs = Math.max(bounds.start, bounds.end - windowMs);
  return { startMs, endMs: bounds.end };
}

export function presetFirstNSeconds(bounds: TimelineBounds, n: number): TimeRange {
  const windowMs = n * 1000;
  const endMs = Math.min(bounds.end, bounds.start + windowMs);
  return { startMs: bounds.start, endMs };
}

export interface TimelineTick {
  ratio: number;
  label: string;
  timestampMs: number;
}

export function computeTicks(bounds: TimelineBounds, maxTicks = 8): TimelineTick[] {
  const dur = bounds.duration;
  let step: number;
  if (dur <= 5000) step = 1000;
  else if (dur <= 15000) step = 2000;
  else if (dur <= 30000) step = 5000;
  else if (dur <= 60000) step = 10000;
  else if (dur <= 120000) step = 15000;
  else if (dur <= 300000) step = 30000;
  else if (dur <= 600000) step = 60000;
  else step = 120000;

  // Adjust to not exceed maxTicks
  const tickCount = Math.ceil(dur / step) + 1;
  if (tickCount > maxTicks) {
    // Increase step
    const needed = Math.ceil(dur / (maxTicks - 1));
    // Round up to nice number
    const niceSteps = [1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000];
    step = niceSteps.find((s) => s >= needed) ?? needed;
  }

  const ticks: TimelineTick[] = [];
  // Align first tick to bounds.start
  ticks.push({
    ratio: 0,
    label: '0s',
    timestampMs: bounds.start,
  });
  for (let t = bounds.start + step; t < bounds.end; t += step) {
    const ratio = offsetToRatio(t, bounds);
    if (ratio >= 1) break;
    ticks.push({
      ratio,
      label: formatTimestampRelative(t, bounds),
      timestampMs: t,
    });
  }
  ticks.push({
    ratio: 1,
    label: formatTimelineTickDuration(dur),
    timestampMs: bounds.end,
  });
  return ticks;
}

export function isEntryInRange(entry: HarEntry, range: TimeRange | null): boolean {
  if (!range) return true;
  const t = parseEntryStart(entry);
  if (t === null) return true;
  return t >= range.startMs && t <= range.endMs;
}
