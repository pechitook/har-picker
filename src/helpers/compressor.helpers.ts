import type { Har, HarEntry, HarHeader, HarCookie } from '../types/Har';
import type { EntryConfig, GlobalStripConfig } from '../types/Config';

function pickHeaders(headers: HarHeader[], global: GlobalStripConfig): HarHeader[] {
  if (global.headerMode === 'all') return headers;
  const wl = global.headerWhitelist;
  return headers.filter((h) => wl.has(h.name.toLowerCase()));
}

function pickCookies(
  cookies: HarCookie[],
  global: GlobalStripConfig
): HarCookie[] | undefined {
  if (global.stripCookieNames) return undefined;
  if (global.stripCookieValues) {
    return cookies.map((c) => ({ name: c.name, value: '' }));
  }
  return cookies;
}

function truncate(text: string | undefined, limit: number | null): string | undefined {
  if (text === undefined) return undefined;
  if (limit === null || limit <= 0) return text;
  if (text.length <= limit) return text;
  return (
    text.slice(0, limit) +
    `\n\n[…truncated: showing first ${limit} of ${text.length} chars]`
  );
}

function stripUrl(url: string, removeQs: boolean): string {
  if (!removeQs) return url;
  const idx = url.indexOf('?');
  return idx === -1 ? url : url.slice(0, idx);
}

function compressEntry(
  entry: HarEntry,
  cfg: EntryConfig,
  global: GlobalStripConfig
): Record<string, unknown> | null {
  if (!cfg.selected) return null;

  const out: Record<string, unknown> = {};
  const f = cfg.fields;

  if (f.url) out.url = stripUrl(entry.request.url, global.removeQueryStrings);
  if (f.method) out.method = entry.request.method;
  if (f.status) out.status = entry.response.status;

  if (f.requestHeaders) {
    out.requestHeaders = pickHeaders(entry.request.headers, global);
  }

  if (f.requestCookies) {
    const c = pickCookies(entry.request.cookies, global);
    if (c !== undefined) out.requestCookies = c;
  }

  if (f.requestBody && entry.request.postData?.text) {
    out.requestBody = entry.request.postData.text;
  }

  if (f.responseHeaders) {
    out.responseHeaders = pickHeaders(entry.response.headers, global);
  }

  if (f.responseCookies) {
    const c = pickCookies(entry.response.cookies, global);
    if (c !== undefined) out.responseCookies = c;
  }

  if (f.responseBody) {
    out.responseBody = truncate(entry.response.content.text, global.truncateBodyChars);
  }

  if (f.timing) out.timing = entry.timings;

  return Object.keys(out).length > 0 ? out : null;
}

export function compressHar(
  har: Har,
  configs: Map<number, EntryConfig>,
  global: GlobalStripConfig,
  allowedIndices?: Set<number>
): string {
  const result: unknown[] = [];

  for (let i = 0; i < har.log.entries.length; i++) {
    if (allowedIndices && !allowedIndices.has(i)) continue;
    const cfg = configs.get(i);
    if (!cfg) continue;
    const compressed = compressEntry(har.log.entries[i]!, cfg, global);
    if (compressed) result.push(compressed);
  }

  return JSON.stringify(result);
}

export function compressHarObject(
  har: Har,
  configs: Map<number, EntryConfig>,
  global: GlobalStripConfig,
  allowedIndices?: Set<number>
): unknown[] {
  const result: unknown[] = [];
  for (let i = 0; i < har.log.entries.length; i++) {
    if (allowedIndices && !allowedIndices.has(i)) continue;
    const cfg = configs.get(i);
    if (!cfg) continue;
    const compressed = compressEntry(har.log.entries[i]!, cfg, global);
    if (compressed) result.push(compressed);
  }
  return result;
}
