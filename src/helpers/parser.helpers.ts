import type { Har } from '../types/Har';
import { formatBytes } from '../utils/format';

export const MAX_PASTE_CHARS = 10 * 1024 * 1024;
const CHUNK_SIZE = 256 * 1024;
const YIELD_INTERVAL = 4;

export class PasteTooLargeError extends Error {
  constructor(public readonly actualChars: number) {
    super(
      `Pasted content is ${formatBytes(actualChars)}, which exceeds the ` +
      `${formatBytes(MAX_PASTE_CHARS)} paste limit. ` +
      `Please trim the HAR (e.g., remove images/fonts) and try again. ` +
      `File import is planned for v2.`
    );
    this.name = 'PasteTooLargeError';
  }
}

export class InvalidHarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidHarError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function parseHarPaste(text: string): Promise<Har> {
  let checked = 0;
  let chunks = 0;

  while (checked < text.length) {
    const end = Math.min(checked + CHUNK_SIZE, text.length);
    checked = end;
    chunks++;
    if (text.length > MAX_PASTE_CHARS) {
      throw new PasteTooLargeError(text.length);
    }
    if (chunks % YIELD_INTERVAL === 0) {
      await sleep(0);
    }
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new InvalidHarError(
      `Not valid JSON: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new InvalidHarError('Root value must be an object.');
  }

  const obj = raw as Record<string, unknown>;
  if (typeof obj.log !== 'object' || obj.log === null) {
    throw new InvalidHarError('Missing "log" property.');
  }

  const log = obj.log as Record<string, unknown>;
  if (!Array.isArray(log.entries)) {
    throw new InvalidHarError('Missing "log.entries" array.');
  }

  if (log.entries.length === 0) {
    throw new InvalidHarError('HAR contains no entries.');
  }

  return raw as Har;
}
