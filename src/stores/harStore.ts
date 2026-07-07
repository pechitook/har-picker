import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Har, ResourceType } from '../types/Har';
import {
  type EntryConfig,
  type FieldKey,
  type GlobalStripConfig,
  type FilterStatusRange,
  type HeaderStripMode,
  COMMON_HEADERS,
  DEFAULT_FIELDS,
  DEFAULT_GLOBAL_STRIP,
} from '../types/Config';
import { compressHar, compressHarObject } from '../helpers/compressor.helpers';
import { inferResourceType } from '../helpers/inferType.helpers';
import { countTokensSync } from '../helpers/tokenizer.helpers';

function freshDefaultStrip(): GlobalStripConfig {
  return {
    ...DEFAULT_GLOBAL_STRIP,
    headerWhitelist: new Set<string>(),
  };
}

export const useHarStore = defineStore('har', () => {
  const har = ref<Har | null>(null);
  const entryTypes = ref<ResourceType[]>([]);
  const configs = ref<Map<number, EntryConfig>>(new Map());
  const globalStrip = ref<GlobalStripConfig>(freshDefaultStrip());

  const filterTypes = ref<Set<ResourceType>>(new Set());
  const filterSearch = ref('');
  const filterStatusRange = ref<FilterStatusRange>('all');

  const error = ref<string | null>(null);
  const loading = ref(false);

  function setHar(newHar: Har): void {
    har.value = newHar;
    error.value = null;
    entryTypes.value = newHar.log.entries.map(
      (e) => inferResourceType(e.response.content.mimeType, e.request.url)
    );
    const map = new Map<number, EntryConfig>();
    for (let i = 0; i < newHar.log.entries.length; i++) {
      map.set(i, { selected: true, fields: { ...DEFAULT_FIELDS } });
    }
    configs.value = map;
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

  function setFilterStatusRange(r: FilterStatusRange): void {
    filterStatusRange.value = r;
  }

  function clear(): void {
    har.value = null;
    entryTypes.value = [];
    configs.value = new Map();
    globalStrip.value = freshDefaultStrip();
    filterTypes.value = new Set();
    filterSearch.value = '';
    filterStatusRange.value = 'all';
    error.value = null;
  }

  const selectedCount = computed(() => {
    let count = 0;
    for (const c of configs.value.values()) {
      if (c.selected) count++;
    }
    return count;
  });

  const filteredIndices = computed(() => {
    if (!har.value) return [];
    const ft = filterTypes.value;
    const fs = filterSearch.value.toLowerCase().trim();
    const fr = filterStatusRange.value;

    return har.value.log.entries
      .map((e, i) => ({ entry: e, index: i, type: entryTypes.value[i] }))
      .filter(({ entry, type }) => {
        if (ft.size > 0 && type && !ft.has(type)) return false;
        if (fs && !entry.request.url.toLowerCase().includes(fs)) return false;
        if (fr !== 'all') {
          const code = entry.response.status;
          const prefix = fr[0];
          const ok =
            prefix === '2' ? code >= 200 && code < 300 :
            prefix === '3' ? code >= 300 && code < 400 :
            prefix === '4' ? code >= 400 && code < 500 :
            prefix === '5' ? code >= 500 && code < 600 :
            true;
          if (!ok) return false;
        }
        return true;
      })
      .map(({ index }) => index);
  });

  const compressedOutput = computed(() => {
    if (!har.value) return '';
    return compressHar(har.value, configs.value, globalStrip.value);
  });

  const compressedObject = computed(() => {
    if (!har.value) return [];
    return compressHarObject(har.value, configs.value, globalStrip.value);
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

  const previewSample = computed(() => {
    const out = compressedOutput.value;
    return out.length > 500 ? out.slice(0, 500) + '…' : out;
  });

  const selectedHeaderCount = computed(() => {
    if (globalStrip.value.headerMode === 'all') return COMMON_HEADERS.length;
    return globalStrip.value.headerWhitelist.size;
  });

  return {
    har,
    entryTypes,
    configs,
    globalStrip,
    filterTypes,
    filterSearch,
    filterStatusRange,
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
    setFilterStatusRange,
    clear,
    selectedCount,
    filteredIndices,
    compressedOutput,
    compressedObject,
    charCount,
    tokenCount,
    kbCount,
    previewSample,
    selectedHeaderCount,
  };
});
