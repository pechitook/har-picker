<p align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Clipboard.png" alt="Clipboard" width="72" height="72" />
</p>

<h1 align="center">HAR Picker</h1>

<p align="center">
  <b>Trim HAR files for AI consumption — 100% in the browser.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3.5-4FC08D?logo=vue.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite_7-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/client--side_only-111111" />
</p>

---

Paste a HAR file, interactively pick which entries and fields to keep, preview the compressed size (chars, tokens, KB), and copy the result to your clipboard — ready to paste into an AI chat.

No server. No uploads. Your data never leaves your machine.

## Features

- **Paste import** — paste raw HAR JSON (up to 10 MB), parsed in chunks to keep the UI responsive
- **Entry selection** — check individual requests or Select All / Deselect All
- **Smart filtering** — filter by resource type (XHR, Doc, Script, etc.), URL search, or status code (filters don't affect selection)
- **Per-entry field stripping** — expand any entry and uncheck irrelevant fields (URL, headers, cookies, body, timing)
- **Global strip rules** — strip cookie values, keep only essential headers, truncate response bodies, remove query strings
- **Live preview** — real-time count, chars, tokens (`cl100k_base`), and KB of the compressed output
- **One-click copy** — compact JSON, straight to clipboard with confirmation toast

## Usage

1. Open the app
2. Paste a HAR file (`Cmd+V` / `Ctrl+V`)
3. Select entries and configure what to keep
4. Preview the compressed size
5. Click **Copy to Clipboard**

## Stack

| Layer | Tech |
|-------|------|
| Framework | Vue 3.5 + TypeScript 5 |
| Build | Vite 7 |
| State | Pinia 3 (sync-only) |
| Styling | Scoped CSS + CSS custom properties |
| Tokenizer | `gpt-tokenizer` (cl100k_base) |

## Project Structure

```
src/
├── main.ts                  # App entry
├── App.vue                  # Root component
├── types/Har.ts             # HAR type definitions
├── helpers/
│   ├── parser.helpers.ts    # Parse + validate HAR
│   ├── compressor.helpers.ts# Strip + serialize
│   ├── tokenizer.helpers.ts # Token counting
│   └── inferType.helpers.ts # MIME → resource category
├── stores/harStore.ts       # Pinia store
├── components/
│   ├── PasteDropZone.vue
│   ├── Toolbar.vue
│   ├── EntryList.vue
│   ├── EntryItem.vue
│   └── PreviewPanel.vue
└── utils/format.ts          # Generic formatters
```

## Development

```bash
npm install
npm run dev
```

## License

MIT
