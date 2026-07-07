import type { ResourceType } from './Har';

export type FieldKey =
  | 'url'
  | 'method'
  | 'status'
  | 'requestHeaders'
  | 'requestCookies'
  | 'requestBody'
  | 'responseHeaders'
  | 'responseCookies'
  | 'responseBody'
  | 'timing';

export const ALL_FIELDS: readonly FieldKey[] = [
  'url',
  'method',
  'status',
  'requestHeaders',
  'requestCookies',
  'requestBody',
  'responseHeaders',
  'responseCookies',
  'responseBody',
  'timing',
];

export interface EntryConfig {
  selected: boolean;
  fields: Record<FieldKey, boolean>;
}

export const DEFAULT_FIELDS: Record<FieldKey, boolean> = {
  url: true,
  method: true,
  status: true,
  requestHeaders: true,
  requestCookies: true,
  requestBody: true,
  responseHeaders: true,
  responseCookies: true,
  responseBody: true,
  timing: true,
};

export type HeaderStripMode = 'all' | 'whitelist';

export const COMMON_HEADERS: readonly string[] = [
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'cache-control',
  'connection',
  'content-encoding',
  'content-length',
  'content-type',
  'cookie',
  'date',
  'etag',
  'host',
  'if-none-match',
  'last-modified',
  'location',
  'origin',
  'referer',
  'server',
  'set-cookie',
  'user-agent',
  'vary',
  'x-requested-with',
];

export const ESSENTIAL_HEADERS: readonly string[] = [
  'accept',
  'cache-control',
  'content-length',
  'content-type',
];

export interface GlobalStripConfig {
  stripCookieValues: boolean;
  stripCookieNames: boolean;
  headerMode: HeaderStripMode;
  headerWhitelist: Set<string>;
  removeQueryStrings: boolean;
  truncateBodyChars: number | null;
}

export const DEFAULT_GLOBAL_STRIP: GlobalStripConfig = {
  stripCookieValues: false,
  stripCookieNames: false,
  headerMode: 'whitelist',
  headerWhitelist: new Set(ESSENTIAL_HEADERS),
  removeQueryStrings: false,
  truncateBodyChars: 100,
};

export type FilterStatusRange = 'all' | '2xx' | '3xx' | '4xx' | '5xx';

export interface Filters {
  types: Set<ResourceType>;
  search: string;
  statusRange: FilterStatusRange;
}
