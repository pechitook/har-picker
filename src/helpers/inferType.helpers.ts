import type { ResourceType } from '../types/Har';

const MIME_MAP: Record<string, ResourceType> = {
  'application/javascript': 'script',
  'text/javascript': 'script',
  'application/ecmascript': 'script',
  'text/html': 'document',
  'application/xhtml+xml': 'document',
  'text/css': 'stylesheet',
  'application/json': 'xhr',
  'text/xml': 'xhr',
  'application/xml': 'xhr',
  'font/': 'font',
  'application/font-woff': 'font',
  'application/font-woff2': 'font',
  'image/': 'image',
  'video/': 'media',
  'audio/': 'media',
};

const EXT_MAP: Array<[RegExp, ResourceType]> = [
  [/\.m?js(\?|$)/, 'script'],
  [/\.css(\?|$)/, 'stylesheet'],
  [/\.(png|jpe?g|gif|svg|webp|ico|avif)(\?|$)/, 'image'],
  [/\.(woff2?|ttf|otf|eot)(\?|$)/, 'font'],
  [/\.(mp4|webm|mp3|ogg|wav)(\?|$)/, 'media'],
];

export function inferResourceType(
  mimeType: string | undefined,
  url: string
): ResourceType {
  if (mimeType) {
    const lower = mimeType!.toLowerCase().split(';')[0]!.trim();
    for (const prefix of Object.keys(MIME_MAP)) {
      if (lower === prefix || lower.startsWith(prefix)) {
        return MIME_MAP[prefix]!;
      }
    }
  }

  for (const [re, type] of EXT_MAP) {
    if (re.test(url)) return type;
  }

  return 'other';
}
