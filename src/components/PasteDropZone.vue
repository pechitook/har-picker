<script setup lang="ts">
import { ref } from 'vue';
import {
  parseHarPaste,
  PasteTooLargeError,
  InvalidHarError,
} from '../helpers/parser.helpers';
import { useHarStore } from '../stores/harStore';

const store = useHarStore();

const pasteValue = ref('');
const pasting = ref(false);
const pasteError = ref<string | null>(null);
const dragOver = ref(false);

async function ingest(text: string): Promise<void> {
  if (!text.trim()) return;
  pasting.value = true;
  pasteError.value = null;

  try {
    const har = await parseHarPaste(text);
    store.setHar(har);
    pasteValue.value = '';
  } catch (e) {
    if (e instanceof PasteTooLargeError || e instanceof InvalidHarError) {
      pasteError.value = e.message;
    } else {
      pasteError.value = `Unexpected error: ${e instanceof Error ? e.message : String(e)}`;
    }
  } finally {
    pasting.value = false;
  }
}

async function handlePaste(e: ClipboardEvent): Promise<void> {
  e.preventDefault();
  e.stopPropagation();
  const text = e.clipboardData?.getData('text/plain') ?? '';
  await ingest(text);
}

async function handleTextareaPaste(e: ClipboardEvent): Promise<void> {
  await handlePaste(e);
}

async function handleSubmit(): Promise<void> {
  await ingest(pasteValue.value);
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  dragOver.value = true;
}

function handleDragLeave(): void {
  dragOver.value = false;
}

async function handleDrop(e: DragEvent): Promise<void> {
  e.preventDefault();
  dragOver.value = false;
  const text = e.dataTransfer?.getData('text/plain') ?? '';
  await ingest(text);
}
</script>

<template>
  <div class="paste-screen">
    <div
      class="paste-zone"
      :class="{ 'is-drag': dragOver, 'is-busy': pasting }"
      tabindex="0"
      @paste="handlePaste"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="paste-content">
        <div class="paste-icon" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
        </div>
        <h2 class="paste-title">Paste your HAR file</h2>
        <p class="paste-hint">
          Press <kbd>Ctrl</kbd>+<kbd>V</kbd> or <kbd>⌘</kbd>+<kbd>V</kbd> anywhere in this area
        </p>

        <div class="paste-divider"><span>or</span></div>

        <form class="paste-form" @submit.prevent="handleSubmit">
          <textarea
            v-model="pasteValue"
            class="paste-textarea"
            placeholder='Paste HAR JSON here, e.g. {"log":{"entries":[...]}}'
            rows="5"
            :disabled="pasting"
            spellcheck="false"
            @paste="handleTextareaPaste"
          />
          <button
            type="submit"
            class="btn btn-primary paste-submit"
            :disabled="pasting || !pasteValue.trim()"
          >
            {{ pasting ? 'Processing…' : 'Load HAR' }}
          </button>
        </form>

        <div v-if="pasteError" class="paste-error" role="alert">
          {{ pasteError }}
        </div>

        <p class="paste-foot">
          Up to 10&nbsp;MB · 100% client-side · nothing leaves your browser
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paste-screen {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 24px;
}

.paste-zone {
  flex: 1;
  max-width: 720px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  outline: none;
  padding: 24px;
}

.paste-zone:focus,
.paste-zone:focus-within,
.paste-zone.is-drag {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.paste-zone.is-busy {
  cursor: progress;
}

.paste-content {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.paste-icon {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paste-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.paste-hint {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.paste-hint kbd {
  display: inline-block;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-family: var(--font-mono);
  color: var(--color-text);
  margin: 0 1px;
}

.paste-divider {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-soft);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 4px 0;
}

.paste-divider::before,
.paste-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.paste-form {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.paste-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.paste-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
  background: var(--color-surface);
}

.paste-submit {
  align-self: flex-end;
  padding: 8px 18px;
  font-size: 0.9rem;
}

.paste-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.paste-error {
  width: 100%;
  max-width: 520px;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  line-height: 1.45;
  text-align: left;
  word-break: break-word;
}

.paste-foot {
  color: var(--color-text-soft);
  font-size: 0.75rem;
  margin: 4px 0 0;
  letter-spacing: 0.02em;
}
</style>
