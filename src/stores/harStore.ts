import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Har, ResourceType } from '../types/Har';
import {
  type EntryConfig,
  type FieldKey,
  type GlobalStripConfig,
  type FilterStatusBucket,
  type FilterStatusRange,
  type HttpMethod,
  type HeaderStripMode,
  COMMON_HEADERS,
  DEFAULT_FIELDS,
  DEFAULT_GLOBAL_STRIP,
  normalizeMethod,
  statusToBucket,
} from '../types/Config';
import { compressHar, compressHarObject } from '../helpers/compressor.helpers';
import { inferResourceType } from '../helpers/inferType.helpers';
import { countTokensSync } from '../helpers/tokenizer.helpers';
import {
  computeTimelineBounds,
  clampRange,
  type TimelineBounds,
  type TimeRange,
} from '../helpers/timeline.helpers';

function freshDefaultStrip(): GlobalStripConfig {
  return {
    ...DEFAULT_GLOBAL_STRIP,
    headerWhitelist: new Set<string>(DEFAULT_GLOBAL_STRIP.headerWhitelist),
  };
}

export const useHarStore = defineStore('har', () => {
  const har = ref<Har | null>(null);
  const entryTypes = ref<ResourceType[]>([]);
  const configs = ref<Map<number, EntryConfig>>(new Map());
  const globalStrip = ref<GlobalStripConfig>(freshDefaultStrip());

  const filterTypes = ref<Set<ResourceType>>(new Set());
  const filterSearch = ref('');
  const filterStatusBuckets = ref<Set<FilterStatusBucket>>(new Set());
  const filterMethods = ref<Set<HttpMethod>>(new Set());
  const filterTimeRange = ref<TimeRange | null>(null);

  const error = ref<string | null>(null);
  const loading = ref(false);

  const baselineStats = ref<{ chars: number; tokens: number } | null>(null);

  function computeBaseline(target: Har): { chars: number; tokens: number } {
    const allConfigs = new Map<number, EntryConfig>();
    for (let i = 0; i < target.log.entries.length; i++) {
      allConfigs.set(i, { selected: true, fields: { ...DEFAULT_FIELDS } });
    }
    const noStrip: GlobalStripConfig = {
      stripCookieValues: false,
      stripCookieNames: false,
      headerMode: 'all',
      headerWhitelist: new Set(),
      removeQueryStrings: false,
      truncateBodyChars: null,
    };
    const output = compressHar(target, allConfigs, noStrip);
    return {
      chars: output.length,
      tokens: countTokensSync(output),
    };
  }

  function setHar(newHar: Har): void {
    har.value = newHar;
    error.value = null;
    globalStrip.value = freshDefaultStrip();
    filterTimeRange.value = null;
    entryTypes.value = newHar.log.entries.map(
      (e) => inferResourceType(e.response.content.mimeType, e.request.url)
    );
    const map = new Map<number, EntryConfig>();
    for (let i = 0; i < newHar.log.entries.length; i++) {
      map.set(i, { selected: true, fields: { ...DEFAULT_FIELDS } });
    }
    configs.value = map;
    baselineStats.value = computeBaseline(newHar);
  }

  function setEntrySelected(index: number, selected: boolean): void {
    const c = configs.value.get(index);
    if (c) configs.value.set(index, { ...c, selected });
  }

  function toggleEntry(index: number): void {
    const c = configs.value.get(index);
    if (c) configs.value.set(index, { ...c, selected: !c.selected });
  }

  function setField(index: number, key: FieldKey, value: boolean): void {
    const c = configs.value.get(index);
    if (c) {
      configs.value.set(index, {
        ...c,
        fields: { ...c.fields, [key]: value },
      });
    }
  }

  function selectAll(): void {
    for (const [i, c] of configs.value) {
      configs.value.set(i, { ...c, selected: true });
    }
  }

  function deselectAll(): void {
    for (const [i, c] of configs.value) {
      configs.value.set(i, { ...c, selected: false });
    }
  }

  function setGlobalStrip(strip: Partial<GlobalStripConfig>): void {
    const next: GlobalStripConfig = {
      ...globalStrip.value,
      ...strip,
    };
    if (strip.headerWhitelist) {
      next.headerWhitelist = new Set(strip.headerWhitelist);
    }
    globalStrip.value = next;
  }

  function setHeaderMode(mode: HeaderStripMode): void {
    globalStrip.value = { ...globalStrip.value, headerMode: mode };
  }

  function toggleHeader(name: string): void {
    const wl = new Set(globalStrip.value.headerWhitelist);
    const lower = name.toLowerCase();
    if (wl.has(lower)) {
      wl.delete(lower);
    } else {
      wl.add(lower);
    }
    globalStrip.value = { ...globalStrip.value, headerWhitelist: wl };
  }

  function setAllHeaders(enabled: boolean): void {
    globalStrip.value = {
      ...globalStrip.value,
      headerMode: enabled ? 'all' : 'whitelist',
      headerWhitelist: enabled ? new Set(COMMON_HEADERS) : new Set(),
    };
  }

  function applyHeaderPreset(names: readonly string[]): void {
    globalStrip.value = {
      ...globalStrip.value,
      headerMode: 'whitelist',
      headerWhitelist: new Set(names.map((n) => n.toLowerCase())),
    };
  }

  function setFilterTypes(types: Set<ResourceType>): void {
    filterTypes.value = types;
  }

  function setFilterSearch(s: string): void {
    filterSearch.value = s;
  }

  function setFilterStatusBuckets(buckets: Set<FilterStatusBucket>): void {
    filterStatusBuckets.value = buckets;
  }

  function setFilterMethods(methods: Set<HttpMethod>): void {
    filterMethods.value = methods;
  }

  /** @deprecated legacy single-value API — maps to Set */
  function setFilterStatusRange(r: FilterStatusRange): void {
    if (r === 'all') {
      filterStatusBuckets.value = new Set();
    } else {
      filterStatusBuckets.value = new Set([r]);
    }
  }

  function setTimeRange(range: TimeRange | null): void {
    if (!range) {
      filterTimeRange.value = null;
      return;
    }
    const bounds = timelineBounds.value;
    if (bounds) {
      filterTimeRange.value = clampRange(range, bounds);
    } else {
      filterTimeRange.value = range;
    }
  }

  function clearTimeFilter(): void {
    filterTimeRange.value = null;
  }

  function clear(): void {
    har.value = null;
    entryTypes.value = [];
    configs.value = new Map();
    globalStrip.value = freshDefaultStrip();
    filterTypes.value = new Set();
    filterSearch.value = '';
    filterStatusBuckets.value = new Set();
    filterMethods.value = new Set();
    filterTimeRange.value = null;
    baselineStats.value = null;
    error.value = null;
  }

  const selectedCount = computed(() => {
    let count = 0;
    for (const c of configs.value.values()) {
      if (c.selected) count++;
    }
    return count;
  });

  const REGEX_HINT = /[|^$*+?\\\[({]/;

  const searchError = computed<string | null>(() => {
    const raw = filterSearch.value.trim();
    if (!raw) return null;
    if (!REGEX_HINT.test(raw)) return null;
    try {
      new RegExp(raw, 'i');
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid regex';
    }
  });

  const searchTester = computed<(url: string) => boolean>(() => {
    const raw = filterSearch.value.trim();
    if (!raw) return () => true;
    if (REGEX_HINT.test(raw)) {
      try {
        const re = new RegExp(raw, 'i');
        return (url: string) => re.test(url);
      } catch {
        // fall through to substring
      }
    }
    const lower = raw.toLowerCase();
    return (url: string) => url.toLowerCase().includes(lower);
  });

  const timelineBounds = computed<TimelineBounds | null>(() => {
    if (!har.value) return null;
    return computeTimelineBounds(har.value);
  });

  const hasTimeFilter = computed(() => filterTimeRange.value !== null);

  const filteredIndices = computed(() => {
    if (!har.value) return [];
    const ft = filterTypes.value;
    const fb = filterStatusBuckets.value;
    const fm = filterMethods.value;
    const tr = filterTimeRange.value;
    const tester = searchTester.value;

    return har.value.log.entries
      .map((e, i) => ({ entry: e, index: i, type: entryTypes.value[i] }))
      .filter(({ entry, type }) => {
        if (ft.size > 0 && type && !ft.has(type)) return false;
        if (!tester(entry.request.url)) return false;
        if (fb.size > 0) {
          const bucket = statusToBucket(entry.response.status);
          if (!bucket || !fb.has(bucket)) return false;
        }
        if (fm.size > 0) {
          const m = normalizeMethod(entry.request.method);
          if (!fm.has(m)) return false;
        }
        if (tr) {
          const t = Date.parse(entry.startedDateTime);
          if (!Number.isNaN(t)) {
            if (t < tr.startMs || t > tr.endMs) return false;
          }
        }
        return true;
      })
      .map(({ index }) => index);
  });

  const compressedOutput = computed(() => {
    if (!har.value) return '';
    return compressHar(
      har.value,
      configs.value,
      globalStrip.value,
      new Set(filteredIndices.value)
    );
  });

  const compressedObject = computed(() => {
    if (!har.value) return null;
    return compressHarObject(
      har.value,
      configs.value,
      globalStrip.value,
      new Set(filteredIndices.value)
    );
  });

  const charCount = computed(() => compressedOutput.value.length);

  const tokenCount = computed(() => {
    try {
      return countTokensSync(compressedOutput.value);
    } catch {
      return Math.round(compressedOutput.value.length / 4);
    }
  });

  const kbCount = computed(() => compressedOutput.value.length / 1024);

  const effectiveSelectedCount = computed(() => {
    let n = 0;
    const allowed = filteredIndices.value;
    for (const i of allowed) {
      const c = configs.value.get(i);
      if (c?.selected) n++;
    }
    return n;
  });

  const selectedHeaderCount = computed(() => {
    if (globalStrip.value.headerMode === 'all') return COMMON_HEADERS.length;
    return globalStrip.value.headerWhitelist.size;
  });

  const savingsPercent = computed(() => {
    const baseline = baselineStats.value?.chars ?? 0;
    if (baseline === 0) return 0;
    const saved = baseline - charCount.value;
    if (saved <= 0) return 0;
    return Math.round((saved / baseline) * 100);
  });

  // Legacy compat: single-value view derived from Set (for test hooks that still use `status=all|2xx`)
  const filterStatusRange = computed<FilterStatusRange>(() => {
    if (filterStatusBuckets.value.size === 0) return 'all';
    if (filterStatusBuckets.value.size === 1) return [...filterStatusBuckets.value][0]! as FilterStatusRange;
    // Multi-select has no single-value representation — return first for compat
    return [...filterStatusBuckets.value][0]! as FilterStatusRange;
  });

  return {
    har,
    entryTypes,
    configs,
    globalStrip,
    filterTypes,
    filterSearch,
    filterStatusBuckets,
    filterStatusRange,
    filterMethods,
    filterTimeRange,
    timelineBounds,
    hasTimeFilter,
    error,
    loading,
    setHar,
    setEntrySelected,
    toggleEntry,
    setField,
    selectAll,
    deselectAll,
    setGlobalStrip,
    setHeaderMode,
    toggleHeader,
    setAllHeaders,
    applyHeaderPreset,
    setFilterTypes,
    setFilterSearch,
    setFilterStatusBuckets,
    setFilterMethods,
    setFilterStatusRange,
    setTimeRange,
    clearTimeFilter,
    clear,
    selectedCount,
    effectiveSelectedCount,
    filteredIndices,
    searchError,
    compressedOutput,
    compressedObject,
    charCount,
    tokenCount,
    kbCount,
    selectedHeaderCount,
    savingsPercent,
    baselineStats,
  };
});
