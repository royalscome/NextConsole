import type { ReplCore, ReplEntry } from '../core/repl-core';
import { escapeHTML } from '../utils/dom';
import { highlightJSON } from '../utils/json';
import { formatTime } from '../utils/time';

/**
 * REPL panel with command input, output display, and command history.
 */
export class ReplPanel {
  private container: HTMLElement;
  private core: ReplCore;
  private outputEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private historyIndex = -1;
  private currentInput = '';
  private cleanups: (() => void)[] = [];

  constructor(container: HTMLElement, core: ReplCore) {
    this.container = container;
    this.core = core;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="nc-toolbar">
        <button class="nc-toolbar-btn nc-repl-clear">Clear</button>
      </div>
      <div class="nc-repl-output"></div>
      <div class="nc-repl-input-wrap">
        <span class="nc-repl-prompt">&gt;</span>
        <textarea class="nc-repl-input" rows="1" placeholder="Enter JavaScript..." spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
        <button class="nc-repl-run">Run</button>
      </div>
    `;

    this.outputEl = this.container.querySelector('.nc-repl-output') as HTMLElement;
    this.inputEl = this.container.querySelector('.nc-repl-input') as HTMLTextAreaElement;

    // Render existing entries
    for (const entry of this.core.getEntries()) {
      this.appendEntry(entry);
    }
  }

  private bindEvents(): void {
    // Run button
    this.container.querySelector('.nc-repl-run')!.addEventListener('click', () => {
      this.executeInput();
    });

    // Clear
    this.container.querySelector('.nc-repl-clear')!.addEventListener('click', () => {
      this.core.clear();
    });

    // Keyboard shortcuts
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.executeInput();
      } else if (e.key === 'ArrowUp' && this.inputEl.selectionStart === 0) {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Auto-resize textarea
    this.inputEl.addEventListener('input', () => {
      this.autoResize();
    });

    // Core events
    const unsub1 = this.core.on('entry', (entry) => {
      this.appendEntry(entry);
    });
    const unsub2 = this.core.on('clear', () => {
      this.outputEl.innerHTML = '';
    });

    this.cleanups.push(unsub1, unsub2);
  }

  private executeInput(): void {
    const code = this.inputEl.value.trim();
    if (!code) return;

    this.historyIndex = -1;
    this.currentInput = '';
    this.inputEl.value = '';
    this.autoResize();

    this.core.execute(code);
  }

  private navigateHistory(direction: number): void {
    const history = this.core.getHistory();
    if (history.length === 0) return;

    if (this.historyIndex === -1) {
      this.currentInput = this.inputEl.value;
    }

    const newIndex = this.historyIndex + direction;

    if (direction < 0) {
      // Going up through history
      const targetIndex = this.historyIndex === -1
        ? history.length - 1
        : Math.max(0, newIndex);
      this.historyIndex = targetIndex;
      this.inputEl.value = history[history.length - 1 - this.historyIndex] || '';
    } else {
      // Going down through history
      if (this.historyIndex <= 0) {
        this.historyIndex = -1;
        this.inputEl.value = this.currentInput;
      } else {
        this.historyIndex = newIndex;
        this.inputEl.value = history[history.length - 1 - this.historyIndex] || '';
      }
    }

    this.autoResize();
  }

  private appendEntry(entry: ReplEntry): void {
    const row = document.createElement('div');
    row.className = `nc-repl-row nc-repl-${entry.type}`;

    const time = `<span class="nc-log-time">${formatTime(entry.timestamp)}</span>`;

    if (entry.type === 'input') {
      row.innerHTML = `${time}<span class="nc-repl-prompt">&gt;</span><span class="nc-repl-code">${escapeHTML(entry.content)}</span>`;
    } else if (entry.type === 'error') {
      row.innerHTML = `${time}<span class="nc-repl-result nc-repl-err">${escapeHTML(entry.content)}</span>`;
    } else {
      // output - try to highlight JSON
      let formatted: string;
      try {
        const parsed = JSON.parse(entry.content);
        formatted = highlightJSON(parsed);
      } catch {
        formatted = escapeHTML(entry.content);
      }
      row.innerHTML = `${time}<span class="nc-repl-result">${formatted}</span>`;
    }

    this.outputEl.appendChild(row);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  private autoResize(): void {
    this.inputEl.style.height = 'auto';
    this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 120)}px`;
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
    this.container.innerHTML = '';
  }
}
