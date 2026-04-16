import type { NextConsolePlugin, PluginAPI } from '../types/plugin';
import { escapeHTML } from '../utils/dom';

interface SourceEntry {
  type: 'script' | 'style' | 'inline-script' | 'inline-style';
  url?: string;
  content?: string;
  size?: number;
}

const SOURCE_CSS = `
.nc-source-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.nc-source-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--nc-border);
  cursor: pointer;
  transition: background 0.15s;
}
.nc-source-item:hover {
  background: var(--nc-bg-hover);
}
.nc-source-item-active {
  background: var(--nc-bg-active);
}
.nc-source-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  margin-right: 6px;
  text-transform: uppercase;
}
.nc-source-tag-script { background: #2b5b84; color: #9cdcfe; }
.nc-source-tag-style { background: #5b3a84; color: #dbb6f2; }
.nc-source-tag-inline-script { background: #1e4a3a; color: #89d185; }
.nc-source-tag-inline-style { background: #4a3a1e; color: #d1b185; }
.nc-source-name {
  color: var(--nc-text);
  font-size: 12px;
  word-break: break-all;
}
.nc-source-meta {
  color: var(--nc-text-muted);
  font-size: 11px;
  margin-top: 2px;
}
.nc-source-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.nc-source-detail-header {
  padding: 6px 10px;
  background: var(--nc-bg-secondary);
  border-bottom: 1px solid var(--nc-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.nc-source-detail-title {
  font-size: 12px;
  color: var(--nc-text);
  word-break: break-all;
}
.nc-source-detail-back {
  padding: 2px 8px;
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  color: var(--nc-text);
  cursor: pointer;
  border-radius: var(--nc-radius);
  font-size: 11px;
  flex-shrink: 0;
  margin-left: 8px;
}
.nc-source-detail-back:hover {
  background: var(--nc-bg-hover);
}
.nc-source-code {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0;
  margin: 0;
  background: var(--nc-bg);
  counter-reset: line;
}
.nc-source-line {
  display: flex;
  padding: 0 12px 0 0;
  min-height: 18px;
  line-height: 18px;
}
.nc-source-line:hover {
  background: var(--nc-bg-hover);
}
.nc-source-lineno {
  display: inline-block;
  width: 40px;
  text-align: right;
  padding-right: 12px;
  color: var(--nc-text-muted);
  user-select: none;
  -webkit-user-select: none;
  flex-shrink: 0;
  font-size: 11px;
}
.nc-source-linetext {
  white-space: pre;
  color: var(--nc-text);
  flex: 1;
  overflow-x: auto;
}
.nc-source-empty {
  padding: 20px;
  text-align: center;
  color: var(--nc-text-muted);
}
.nc-source-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
`;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function collectSources(): SourceEntry[] {
  const entries: SourceEntry[] = [];

  // External scripts
  document.querySelectorAll('script[src]').forEach((el) => {
    const src = (el as HTMLScriptElement).src;
    entries.push({ type: 'script', url: src });
  });

  // Inline scripts
  document.querySelectorAll('script:not([src])').forEach((el) => {
    const text = el.textContent || '';
    if (text.trim()) {
      entries.push({ type: 'inline-script', content: text, size: text.length });
    }
  });

  // External stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const href = (el as HTMLLinkElement).href;
    entries.push({ type: 'style', url: href });
  });

  // Inline styles
  document.querySelectorAll('style').forEach((el) => {
    const text = el.textContent || '';
    if (text.trim() && !el.closest('#nextconsole-host')) {
      entries.push({ type: 'inline-style', content: text, size: text.length });
    }
  });

  return entries;
}

function getDisplayName(entry: SourceEntry): string {
  if (entry.url) {
    try {
      const u = new URL(entry.url);
      return u.pathname.split('/').pop() || u.pathname;
    } catch {
      return entry.url;
    }
  }
  const preview = (entry.content || '').trim().slice(0, 60);
  return preview + (preview.length >= 60 ? '...' : '');
}

export function createSourcePlugin(): NextConsolePlugin {
  let container: HTMLElement;
  let currentView: 'list' | 'detail' = 'list';

  function renderList() {
    const sources = collectSources();
    if (sources.length === 0) {
      container.innerHTML = '<div class="nc-source-view"><div class="nc-source-empty">No sources found</div></div>';
      return;
    }

    const listHTML = sources.map((entry, i) => {
      const tagClass = `nc-source-tag-${entry.type}`;
      const label = entry.type.replace('-', ' ');
      const name = escapeHTML(getDisplayName(entry));
      const meta = entry.url
        ? escapeHTML(entry.url)
        : `${formatSize(entry.size || 0)}`;
      return `<div class="nc-source-item" data-idx="${i}">
        <span class="nc-source-tag ${tagClass}">${label}</span>
        <span class="nc-source-name">${name}</span>
        <div class="nc-source-meta">${meta}</div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="nc-source-view">
        <div class="nc-toolbar">
          <button class="nc-toolbar-btn nc-source-refresh">Refresh</button>
          <span style="color:var(--nc-text-muted);font-size:11px;margin-left:8px">${sources.length} sources</span>
        </div>
        <div class="nc-source-list">${listHTML}</div>
      </div>`;

    container.querySelector('.nc-source-refresh')!.addEventListener('click', renderList);

    container.querySelector('.nc-source-list')!.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.nc-source-item') as HTMLElement;
      if (!item) return;
      const idx = parseInt(item.dataset.idx!, 10);
      showDetail(sources[idx]);
    });

    currentView = 'list';
  }

  async function showDetail(entry: SourceEntry) {
    currentView = 'detail';
    const title = entry.url ? escapeHTML(entry.url) : escapeHTML(entry.type);

    container.innerHTML = `
      <div class="nc-source-view">
        <div class="nc-source-detail-header">
          <span class="nc-source-detail-title">${title}</span>
          <button class="nc-source-detail-back">← Back</button>
        </div>
        <div class="nc-source-code"><div class="nc-source-empty">Loading...</div></div>
      </div>`;

    container.querySelector('.nc-source-detail-back')!.addEventListener('click', renderList);

    let code = entry.content || '';

    if (!code && entry.url) {
      try {
        const res = await fetch(entry.url);
        code = await res.text();
      } catch (err) {
        const codeEl = container.querySelector('.nc-source-code') as HTMLElement;
        codeEl.innerHTML = `<div class="nc-source-empty" style="color:var(--nc-error)">Failed to fetch: ${escapeHTML(String(err))}</div>`;
        return;
      }
    }

    const lines = code.split('\n');
    const codeEl = container.querySelector('.nc-source-code') as HTMLElement;

    // Render in chunks for large files
    const MAX_RENDER = 5000;
    const renderCount = Math.min(lines.length, MAX_RENDER);
    let html = '';
    for (let i = 0; i < renderCount; i++) {
      html += `<div class="nc-source-line"><span class="nc-source-lineno">${i + 1}</span><span class="nc-source-linetext">${escapeHTML(lines[i])}</span></div>`;
    }
    if (lines.length > MAX_RENDER) {
      html += `<div class="nc-source-empty">... ${lines.length - MAX_RENDER} more lines truncated</div>`;
    }
    codeEl.innerHTML = html;
  }

  return {
    name: 'source',
    version: '1.0.0',
    tab: {
      label: 'Source',
      render(el, api) {
        container = el;
        api.addStyle(SOURCE_CSS);
        renderList();
      },
      destroy() {
        container.innerHTML = '';
      },
    },
  };
}
