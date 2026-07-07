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

function buildHarEntry(
  entry: HarEntry,
  cfg: EntryConfig,
  global: GlobalStripConfig
): Record<string, unknown> | null {
  if (!cfg.selected) return null;

  const out: Record<string, unknown> = {};
  const f = cfg.fields;

  // Always-on metadata: traceability fields the LLM needs for timeline analysis.
  out.startedDateTime = entry.startedDateTime;
  out.time = entry.time;
  if (entry.pageref) out.pageref = entry.pageref;
  if (entry.serverIPAddress) out.serverIPAddress = entry.serverIPAddress;
  if (entry.connection) out.connection = entry.connection;
  if (entry._resourceType) out._resourceType = entry._resourceType;
  if (entry.cache && Object.keys(entry.cache).length > 0) {
    out.cache = entry.cache;
  }

  // Request object — toggles map to HAR paths.
  const request: Record<string, unknown> = {};
  if (f.url) request.url = stripUrl(entry.request.url, global.removeQueryStrings);
  if (f.method) request.method = entry.request.method;
  if (entry.request.httpVersion) request.httpVersion = entry.request.httpVersion;
  if (f.requestHeaders) {
    request.headers = pickHeaders(entry.request.headers, global);
  }
  if (!global.removeQueryStrings && entry.request.queryString.length > 0) {
    request.queryString = entry.request.queryString;
  }
  if (f.requestCookies) {
    const c = pickCookies(entry.request.cookies, global);
    if (c !== undefined) request.cookies = c;
  }
  if (f.requestBody && entry.request.postData) {
    request.postData = entry.request.postData;
  }
  if (entry.request.headersSize > 0) request.headersSize = entry.request.headersSize;
  if (entry.request.bodySize > 0) request.bodySize = entry.request.bodySize;
  if (Object.keys(request).length > 0) out.request = request;

  // Response object.
  const response: Record<string, unknown> = {};
  if (f.status) {
    response.status = entry.response.status;
    if (entry.response.statusText) response.statusText = entry.response.statusText;
  }
  if (entry.response.httpVersion) response.httpVersion = entry.response.httpVersion;
  if (f.responseHeaders) {
    response.headers = pickHeaders(entry.response.headers, global);
  }
  if (f.responseCookies) {
    const c = pickCookies(entry.response.cookies, global);
    if (c !== undefined) response.cookies = c;
  }
  if (f.responseBody) {
    response.content = {
      ...entry.response.content,
      text: truncate(entry.response.content.text, global.truncateBodyChars),
    };
  }
  if (entry.response.redirectURL) response.redirectURL = entry.response.redirectURL;
  if (entry.response.headersSize > 0) response.headersSize = entry.response.headersSize;
  if (entry.response.bodySize > 0) response.bodySize = entry.response.bodySize;
  if (Object.keys(response).length > 0) out.response = response;

  // Timings (user-selected — can be heavy if verbose).
  if (f.timing) out.timings = entry.timings;

  return out;
}

function buildHarLog(
  har: Har,
  configs: Map<number, EntryConfig>,
  global: GlobalStripConfig,
  allowedIndices?: Set<number>
): Record<string, unknown> {
  const entries: unknown[] = [];

  for (let i = 0; i < har.log.entries.length; i++) {
    if (allowedIndices && !allowedIndices.has(i)) continue;
    const cfg = configs.get(i);
    if (!cfg) continue;
    const built = buildHarEntry(har.log.entries[i]!, cfg, global);
    if (built) entries.push(built);
  }

  const log: Record<string, unknown> = {
    version: har.log.version,
    creator: har.log.creator,
    entries,
  };
  if (har.log.browser) log.browser = har.log.browser;
  if (har.log.pages && har.log.pages.length > 0) log.pages = har.log.pages;

  return log;
}

export function compressHar(
  har: Har,
  configs: Map<number, EntryConfig>,
  global: GlobalStripConfig,
  allowedIndices?: Set<number>
): string {
  return JSON.stringify({ log: buildHarLog(har, configs, global, allowedIndices) });
}

export function compressHarObject(
  har: Har,
  configs: Map<number, EntryConfig>,
  global: GlobalStripConfig,
  allowedIndices?: Set<number>
): Record<string, unknown> {
  return { log: buildHarLog(har, configs, global, allowedIndices) };
}
