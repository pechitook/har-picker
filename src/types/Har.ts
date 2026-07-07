export interface HarHeader {
  name: string;
  value: string;
}

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface HarQueryString {
  name: string;
  value: string;
}

export interface HarPostData {
  mimeType?: string;
  text?: string;
  params?: HarQueryString[];
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  headers: HarHeader[];
  queryString: HarQueryString[];
  cookies: HarCookie[];
  headersSize: number;
  bodySize: number;
  postData?: HarPostData;
}

export interface HarContent {
  size: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HarHeader[];
  cookies: HarCookie[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

export interface HarTiming {
  blocked?: number;
  dns?: number;
  connect?: number;
  ssl?: number;
  send?: number;
  wait?: number;
  receive?: number;
}

export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: Record<string, unknown>;
  timings: HarTiming;
  serverIPAddress?: string;
  connection?: string;
  _resourceType?: string;
}

export interface HarLog {
  version: string;
  creator: { name: string; version: string };
  browser?: { name: string; version: string };
  pages?: unknown[];
  entries: HarEntry[];
}

export interface Har {
  log: HarLog;
}

export type ResourceType =
  | 'xhr'
  | 'document'
  | 'script'
  | 'stylesheet'
  | 'image'
  | 'media'
  | 'font'
  | 'other';
