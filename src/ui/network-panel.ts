import type { NetworkEntry, StreamMessage } from '../types';
import type { NetworkCore } from '../core/network-core';
import { formatDuration, formatTime } from '../utils/time';
import { highlightJSON } from '../utils/json';
import { escapeHTML } from '../utils/dom';

type SortKey = 'url' | 'method' | 'status' | 'duration' | 'type';
type SortDir = 'asc' | 'desc';

/**
 * Network panel showing fetch/XHR/SSE requests in a sortable table.
 */
export class NetworkPanel {
  private container: HTMLElement;
  private core: NetworkCore;
  private tableBody: HTMLElement | null = null;
  private detailEl: HTMLElement | null = null;
  private selectedId: number | null = null;
  private sortKey: SortKey = 'duration';
  private sortDir: SortDir = 'desc';
  private searchText = '';
  private cleanups: (() => void)[] = [];

  constructor(container: HTMLElement, core: NetworkCore) {
    this.container = container;
    this.core = core;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="nc-toolbar">
        <input type="text" placeholder="Filter requests..." class="nc-network-search" />
        <button class="nc-toolbar-btn nc-network-clear">Clear</button>
      </div>
      <div style="flex:1;overflow:auto;display:flex;flex-direction:column">
        <div style="flex:1;overflow:auto">
          <table class="nc-network-table">
            <thead>
              <tr>
                <th data-nc-sort="method" style="width:60px">Method</th>
                <th data-nc-sort="url">URL</th>
                <th data-nc-sort="status" style="width:60px">Status</th>
                <th data-nc-sort="type" style="width:50px">Type</th>
                <th data-nc-sort="duration" style="width:80px">Time</th>
              </tr>
            </thead>
            <tbody class="nc-network-tbody"></tbody>
          </table>
        </div>
        <div class="nc-network-detail" style="display:none"></div>
      </div>
    `;

    this.tableBody = this.container.querySelector('.nc-network-tbody');
    this.detailEl = this.container.querySelector('.nc-network-detail');
    this.refreshTable();
  }

  private bindEvents(): void {
    // Sort
    this.container.querySelectorAll('[data-nc-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = (th as HTMLElement).dataset.ncSort as SortKey;
        if (this.sortKey === key) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortKey = key;
          this.sortDir = 'asc';
        }
        this.refreshTable();
      });
    });

    // Search
    const searchInput = this.container.querySelector('.nc-network-search') as HTMLInputElement;
    let timer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.searchText = searchInput.value;
        this.refreshTable();
      }, 150);
    });

    // Clear
    this.container.querySelector('.nc-network-clear')!.addEventListener('click', () => {
      this.core.clear();
      this.selectedId = null;
      if (this.detailEl) this.detailEl.style.display = 'none';
    });

    // Row click
    this.container.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement).closest('[data-nc-req-id]') as HTMLElement;
      if (row) {
        this.selectedId = Number(row.dataset.ncReqId);
        this.showDetail();
      }
    });

    // Core events
    const unsub1 = this.core.on('request', () => this.refreshTable());
    const unsub2 = this.core.on('update', () => {
      this.refreshTable();
      if (this.selectedId) this.showDetail();
    });
    const unsub3 = this.core.on('clear', () => this.refreshTable());
    this.cleanups.push(unsub1, unsub2, unsub3);
  }

  private refreshTable(): void {
    if (!this.tableBody) return;

    let entries = this.core.getEntries().slice();

    // Filter
    if (this.searchText) {
      const lower = this.searchText.toLowerCase();
      entries = entries.filter((e) => e.url.toLowerCase().includes(lower));
    }

    // Sort
    entries.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (this.sortKey) {
        case 'url': va = a.url; vb = b.url; break;
        case 'method': va = a.method; vb = b.method; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'type': va = a.type; vb = b.type; break;
        case 'duration': va = a.duration; vb = b.duration; break;
      }
      if (typeof va === 'string') {
        const cmp = va.localeCompare(vb as string);
        return this.sortDir === 'asc' ? cmp : -cmp;
      }
      return this.sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    let html = '';
    for (const entry of entries) {
      const statusClass = entry.pending ? 'nc-status-pending' : entry.status >= 400 ? 'nc-status-err' : 'nc-status-ok';
      const statusText = entry.pending ? '⏳' : String(entry.status);
      const shortUrl = entry.url.length > 80 ? entry.url.slice(0, 80) + '…' : entry.url;
      const msgCount = entry.messages && entry.messages.length > 0 ? ` (${entry.messages.length})` : '';

      html += `<tr data-nc-req-id="${entry.id}">`;
      html += `<td>${escapeHTML(entry.method)}</td>`;
      html += `<td title="${escapeHTML(entry.url)}">${escapeHTML(shortUrl)}</td>`;
      html += `<td class="${statusClass}">${statusText}</td>`;
      html += `<td>${entry.type}${msgCount}</td>`;
      html += `<td>${entry.pending ? (entry.type === 'sse' || entry.type === 'websocket' ? '●' : '-') : formatDuration(entry.duration)}</td>`;
      html += `</tr>`;
    }

    this.tableBody.innerHTML = html;
  }

  private showDetail(): void {
    if (!this.detailEl || !this.selectedId) return;

    const entry = this.core.getEntries().find((e) => e.id === this.selectedId);
    if (!entry) {
      this.detailEl.style.display = 'none';
      return;
    }

    this.detailEl.style.display = 'block';
    let html = '';

    // General
    html += `<div class="nc-detail-section">`;
    html += `<div class="nc-detail-title">General</div>`;
    html += `<div class="nc-detail-body">`;
    html += `URL: ${escapeHTML(entry.url)}\n`;
    html += `Method: ${entry.method}\n`;
    html += `Status: ${entry.status} ${escapeHTML(entry.statusText)}\n`;
    html += `Type: ${entry.type}\n`;
    html += `Duration: ${entry.pending ? 'pending...' : formatDuration(entry.duration)}\n`;
    if (entry.messages) html += `Messages: ${entry.messages.length}\n`;
    if (entry.error) html += `Error: ${escapeHTML(entry.error)}\n`;
    html += `</div></div>`;

    // Messages stream (SSE / WebSocket)
    if (entry.messages && entry.messages.length > 0) {
      html += `<div class="nc-detail-section">`;
      html += `<div class="nc-detail-title">Messages (${entry.messages.length})${entry.pending ? ' · <span style="color:#3dc9b0">● Live</span>' : ''}</div>`;
      html += `<div class="nc-detail-body nc-messages-stream">`;
      const recent = entry.messages.slice(-100);
      if (entry.messages.length > 100) {
        html += `<div class="nc-msg-row nc-msg-info">... ${entry.messages.length - 100} earlier messages hidden</div>`;
      }
      for (const msg of recent) {
        const dirClass = msg.direction === 'out' ? 'nc-msg-out' : 'nc-msg-in';
        const arrow = msg.direction === 'out' ? '↑' : '↓';
        const sizeStr = msg.size != null ? ` · ${this.formatSize(msg.size)}` : '';
        const evtStr = msg.event ? ` [${escapeHTML(msg.event)}]` : '';
        html += `<div class="nc-msg-row ${dirClass}">`;
        html += `<span class="nc-msg-arrow">${arrow}</span>`;
        html += `<span class="nc-msg-time">${formatTime(msg.timestamp)}</span>`;
        html += `<span class="nc-msg-event">${evtStr}</span>`;
        html += `<span class="nc-msg-data">${this.formatMsgData(msg.data)}</span>`;
        html += `<span class="nc-msg-size">${sizeStr}</span>`;
        html += `</div>`;
      }
      html += `</div></div>`;
    }

    // Request Headers
    html += this.renderHeaders('Request Headers', entry.requestHeaders);

    // Response Headers
    html += this.renderHeaders('Response Headers', entry.responseHeaders);

    // Request Body
    if (entry.requestBody) {
      html += `<div class="nc-detail-section">`;
      html += `<div class="nc-detail-title">Request Body</div>`;
      html += `<div class="nc-detail-body">${highlightJSON(entry.requestBody)}</div>`;
      html += `</div>`;
    }

    // Response Body
    if (entry.responseBody) {
      html += `<div class="nc-detail-section">`;
      html += `<div class="nc-detail-title">Response Body</div>`;
      html += `<div class="nc-detail-body">${highlightJSON(entry.responseBody)}</div>`;
      html += `</div>`;
    }

    this.detailEl.innerHTML = html;

    // Auto-scroll messages to bottom
    const msgStream = this.detailEl.querySelector('.nc-messages-stream');
    if (msgStream) {
      msgStream.scrollTop = msgStream.scrollHeight;
    }
  }

  private formatMsgData(data: string): string {
    try {
      const parsed = JSON.parse(data);
      return highlightJSON(parsed);
    } catch {
      return escapeHTML(data);
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  private renderHeaders(title: string, headers: Record<string, string>): string {
    const keys = Object.keys(headers);
    if (keys.length === 0) return '';

    let html = `<div class="nc-detail-section">`;
    html += `<div class="nc-detail-title">${title}</div>`;
    html += `<div class="nc-detail-body">`;
    for (const key of keys) {
      html += `${escapeHTML(key)}: ${escapeHTML(headers[key])}\n`;
    }
    html += `</div></div>`;
    return html;
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
    this.container.innerHTML = '';
  }
}
