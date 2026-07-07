import { encode } from 'gpt-tokenizer';

let enabled = true;

export function disableTokenizer(): void {
  enabled = false;
}

export function countTokensSync(text: string): number {
  if (!enabled) return Math.round(text.length / 4);
  try {
    return encode(text).length;
  } catch {
    return Math.round(text.length / 4);
  }
}
