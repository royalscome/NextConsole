import type { LogEntry, LogLevel } from '../types';
import type { ConsoleCore } from '../core/console-core';
import { formatTime } from '../utils/time';
import { highlightJSON } from '../utils/json';
import { safeStringify } from '../utils/json';
import { escapeHTML } from '../utils/dom';

const MAX_RENDER = 500;

/**
 * Console panel with auto-height rows that support text wrapping.
 */
export class ConsolePanel {
  private container: HTMLElement;
  private listEl!: HTMLElement;
  private toolbarEl!: HTMLElement;
  private core: ConsoleCore;
  private filteredEntries: LogEntry[] = [];
  private activeFilters = new Set<LogLevel>();
  private searchText = '';
  private scrollLocked = true;
  private cleanups: (() => void)[] = [];

  constructor(container: HTMLElement, core: ConsoleCore) {
    this.container = container;
    this.core = core;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    // Toolbar
    this.toolbarEl = document.createElement('div');
    this.toolbarEl.className = 'nc-toolbar';
    this.toolbarEl.innerHTML = `
      <button class="nc-toolbar-btn" data-nc-filter="log">Log</button>
      <button class="nc-toolbar-btn" data-nc-filter="info">Info</button>
      <button class="nc-toolbar-btn" data-nc-filter="warn">Warn</button>
      <button class="nc-toolbar-btn" data-nc-filter="error">Error</button>
      <button class="nc-toolbar-btn" data-nc-filter="debug">Debug</button>
      <input type="text" placeholder="Filter logs..." class="nc-console-search" />
      <button class="nc-toolbar-btn nc-console-clear">Clear</button>
      <button class="nc-toolbar-btn nc-console-export">Export</button>
    `;
    this.container.appendChild(this.toolbarEl);

    // Scrollable list container
    this.listEl = document.createElement('div');
    this.listEl.className = 'nc-console-list';
    this.container.appendChild(this.listEl);

    this.refreshEntries();
  }

  private bindEvents(): void {
    // Filter buttons
    this.toolbarEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-nc-filter]') as HTMLElement;
      if (btn) {
        const level = btn.getAttribute('data-nc-filter') as LogLevel;
        if (this.activeFilters.has(level)) {
          this.activeFilters.delete(level);
          btn.classList.remove('nc-active');
        } else {
          this.activeFilters.add(level);
          btn.classList.add('nc-active');
        }
        this.refreshEntries();
      }
    });

    // Search
    const searchInput = this.toolbarEl.querySelector('.nc-console-search') as HTMLInputElement;
    let searchTimer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.searchText = searchInput.value;
        this.refreshEntries();
      }, 150);
    });

    // Clear
    this.toolbarEl.querySelector('.nc-console-clear')!.addEventListener('click', () => {
      this.core.clear();
    });

    // Export
    this.toolbarEl.querySelector('.nc-console-export')!.addEventListener('click', () => {
      const data = this.core.exportJSON();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nextconsole-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Scroll: detect if user scrolled away from bottom
    this.listEl.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.listEl;
      this.scrollLocked = scrollTop + clientHeight >= scrollHeight - 40;
    });

    // Core events
    const unsub1 = this.core.on('entry', () => {
      this.refreshEntries();
    });
    const unsub2 = this.core.on('streamUpdate', () => {
      this.refreshEntries();
    });
    const unsub3 = this.core.on('clear', () => {
      this.refreshEntries();
    });

    this.cleanups.push(unsub1, unsub2, unsub3);
  }

  private refreshEntries(): void {
    const levels = this.activeFilters.size > 0 ? Array.from(this.activeFilters) : undefined;
    this.filteredEntries = this.core.getFilteredEntries(levels, this.searchText || undefined);
    this.renderList();
  }

  private renderList(): void {
    const entries = this.filteredEntries;
    // Only render the last MAX_RENDER entries for performance
    const start = Math.max(0, entries.length - MAX_RENDER);

    let html = '';
    if (start > 0) {
      html += `<div class="nc-log-entry" style="justify-content:center;color:var(--nc-text-muted);font-size:11px">... 省略了 ${start} 条更早的日志 ...</div>`;
    }
    for (let i = start; i < entries.length; i++) {
      const entry = entries[i];
      const streamClass = entry.streaming ? ' nc-log-streaming' : '';
      html += `<div class="nc-log-entry nc-log-level-${entry.level}${streamClass}">`;
      html += `<span class="nc-log-time">${formatTime(entry.timestamp)}</span>`;
      html += `<span class="nc-log-body">${this.renderArgs(entry.args)}</span>`;
      html += `</div>`;
    }
    this.listEl.innerHTML = html;

    // Auto-scroll to bottom
    if (this.scrollLocked && entries.length > 0) {
      this.listEl.scrollTop = this.listEl.scrollHeight;
    }
  }

  private renderArgs(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') return escapeHTML(arg);
        if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) {
          return `<span style="color:#b5cea8">${String(arg)}</span>`;
        }
        if (typeof arg === 'object') {
          return highlightJSON(arg);
        }
        return escapeHTML(String(arg));
      })
      .join(' ');
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
    this.container.innerHTML = '';
  }
}
