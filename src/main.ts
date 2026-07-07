import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { useHarStore } from './stores/harStore';
import type { ResourceType } from './types/Har';
import type { FilterStatusRange } from './types/Config';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

declare global {
  interface Window {
    __harStore?: ReturnType<typeof useHarStore>;
    __test?: Record<string, string>;
  }
}

const params = new URLSearchParams(window.location.search);

const store = useHarStore();
window.__harStore = store;
window.__test = {
  demo: params.get('demo') ?? '',
  filter: params.get('filter') ?? '',
  status: params.get('status') ?? '',
  deselect: params.get('deselect') ?? '',
  truncate: params.get('truncate') ?? '',
  strip: params.get('strip') ?? '',
  expand: params.get('expand') ?? '',
  search: params.get('search') ?? '',
};

// Test hook for headless validation.
// Activate with: ?demo=<base64-encoded-HAR>&filter=xhr&status=5xx&...
// Inert without the query param.
const demo = params.get('demo');
if (demo) {
  try {
    const decoded = decodeURIComponent(atob(demo));
    setTimeout(() => {
      const input = document.querySelector('.paste-textarea') as HTMLTextAreaElement | null;
      if (input) {
        input.value = decoded;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = input.closest('form');
        if (form) form.requestSubmit();
      }

      const applyTestFilters = () => {
        const filter = params.get('filter');
        if (filter) {
          const types = filter.split(',') as ResourceType[];
          store.setFilterTypes(new Set(types));
        }
        const status = params.get('status') as FilterStatusRange | null;
        if (status) {
          store.setFilterStatusRange(status);
        }
        const truncate = params.get('truncate');
        if (truncate) {
          store.setGlobalStrip({ truncateBodyChars: Number(truncate) });
        }
        const strip = params.get('strip');
        if (strip) {
          const flags = strip.split(',');
          store.setGlobalStrip({
            stripCookieValues: flags.includes('cookie-values'),
            stripCookieNames: flags.includes('cookie-names'),
            removeQueryStrings: flags.includes('query'),
          });
          if (flags.includes('essential')) {
            store.applyHeaderPreset(['content-type', 'content-length', 'cache-control', 'accept']);
          }
        }
        const deselect = params.get('deselect');
        if (deselect) {
          deselect.split(',').forEach((idx) => {
            const i = Number(idx);
            if (!Number.isNaN(i)) store.setEntrySelected(i, false);
          });
        }
        const search = params.get('search');
        if (search) {
          store.setFilterSearch(search);
        }
        const expand = params.get('expand');
        if (expand) {
          requestAnimationFrame(() => {
            const all = document.querySelectorAll('details.entry');
            expand.split(',').forEach((idx) => {
              const i = Number(idx);
              if (!Number.isNaN(i) && all[i]) (all[i] as HTMLDetailsElement).open = true;
            });
          });
        }
        const showStrip = params.get('strip-panel');
        if (showStrip) {
          requestAnimationFrame(() => {
            const btn = document.querySelector('.toolbar-strip-toggle') as HTMLButtonElement | null;
            if (btn) btn.click();
          });
        }
      };

      const start = Date.now();
      const watch = setInterval(() => {
        if (store.har || Date.now() - start > 5000) {
          clearInterval(watch);
          setTimeout(applyTestFilters, 50);
        }
      }, 20);
    }, 50);
  } catch (e) {
    console.error('Failed to load demo:', e);
  }
}
