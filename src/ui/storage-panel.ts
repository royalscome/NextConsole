import type { StorageType } from '../types';
import type { StorageCore } from '../core/storage-core';
import { escapeHTML } from '../utils/dom';

/**
 * Storage panel for viewing/editing localStorage, sessionStorage, and cookies.
 */
export class StoragePanel {
  private container: HTMLElement;
  private core: StorageCore;
  private tableBody: HTMLElement | null = null;
  private searchText = '';
  private activeType: StorageType | 'all' = 'all';
  private cleanups: (() => void)[] = [];
  private currentEntries: { key: string; value: string; type: StorageType }[] = [];

  constructor(container: HTMLElement, core: StorageCore) {
    this.container = container;
    this.core = core;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="nc-toolbar">
        <button class="nc-toolbar-btn nc-active" data-nc-stype="all">All</button>
        <button class="nc-toolbar-btn" data-nc-stype="localStorage">Local</button>
        <button class="nc-toolbar-btn" data-nc-stype="sessionStorage">Session</button>
        <button class="nc-toolbar-btn" data-nc-stype="cookie">Cookie</button>
        <input type="text" placeholder="Filter keys..." class="nc-storage-search" />
        <button class="nc-toolbar-btn nc-storage-add">+ Add</button>
        <button class="nc-toolbar-btn nc-storage-refresh">↻</button>
      </div>
      <div style="flex:1;overflow:auto">
        <table class="nc-storage-table">
          <thead>
            <tr>
              <th style="width:25%">Key</th>
              <th>Value</th>
              <th style="width:auto">Type</th>
              <th style="width:1%">Actions</th>
            </tr>
          </thead>
          <tbody class="nc-storage-tbody"></tbody>
        </table>
      </div>
    `;

    this.tableBody = this.container.querySelector('.nc-storage-tbody');
    this.refreshTable();
  }

  private bindEvents(): void {
    // Type filter
    this.container.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-nc-stype]') as HTMLElement;
      if (btn) {
        this.activeType = btn.dataset.ncStype as StorageType | 'all';
        this.container.querySelectorAll('[data-nc-stype]').forEach((b) => b.classList.remove('nc-active'));
        btn.classList.add('nc-active');
        this.refreshTable();
      }
    });

    // Search
    const searchInput = this.container.querySelector('.nc-storage-search') as HTMLInputElement;
    let timer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.searchText = searchInput.value;
        this.refreshTable();
      }, 150);
    });

    // Add
    this.container.querySelector('.nc-storage-add')!.addEventListener('click', () => {
      this.showAddDialog();
    });

    // Refresh
    this.container.querySelector('.nc-storage-refresh')!.addEventListener('click', () => {
      this.refreshTable();
    });

    // Table actions (edit, delete, expand) via delegation
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.ncAction === 'edit') {
        const key = target.dataset.ncKey!;
        const type = target.dataset.ncType as StorageType;
        this.showEditDialog(type, key);
        return;
      }
      if (target.dataset.ncAction === 'delete') {
        const key = target.dataset.ncKey!;
        const type = target.dataset.ncType as StorageType;
        this.core.removeItem(type, key);
        this.refreshTable();
        return;
      }
      // Click row to expand/collapse
      const tr = target.closest('tr[data-nc-row]') as HTMLElement;
      if (tr && !target.closest('.nc-storage-actions')) {
        const detailRow = tr.nextElementSibling as HTMLElement;
        if (detailRow && detailRow.classList.contains('nc-storage-detail')) {
          tr.classList.remove('nc-storage-expanded');
          detailRow.remove();
        } else {
          // Collapse any other expanded row
          this.tableBody?.querySelectorAll('.nc-storage-detail').forEach(el => {
            el.previousElementSibling?.classList.remove('nc-storage-expanded');
            el.remove();
          });
          tr.classList.add('nc-storage-expanded');
          const idx = parseInt(tr.dataset.ncIdx || '0', 10);
          const fullValue = this.currentEntries[idx]?.value || '';
          const detail = document.createElement('tr');
          detail.className = 'nc-storage-detail';
          detail.innerHTML = `<td colspan="4">${escapeHTML(fullValue)}</td>`;
          tr.after(detail);
        }
      }
    });

    // Core events
    const unsub = this.core.on('update', () => this.refreshTable());
    this.cleanups.push(unsub);
  }

  refreshTable(): void {
    if (!this.tableBody) return;

    let entries = this.core.getEntries(this.searchText || undefined);

    if (this.activeType !== 'all') {
      entries = entries.filter((e) => e.type === this.activeType);
    }

    this.currentEntries = entries;

    let html = '';
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const shortVal = entry.value.length > 60 ? entry.value.slice(0, 60) + '…' : entry.value;
      html += `<tr data-nc-row data-nc-idx="${i}" style="cursor:pointer">`;
      html += `<td>${escapeHTML(entry.key)}</td>`;
      html += `<td>${escapeHTML(shortVal)}</td>`;
      html += `<td class="nc-storage-type">${entry.type}</td>`;
      html += `<td class="nc-storage-actions">`;
      html += `<button data-nc-action="edit" data-nc-key="${escapeHTML(entry.key)}" data-nc-type="${entry.type}">Edit</button>`;
      html += `<button class="nc-danger" data-nc-action="delete" data-nc-key="${escapeHTML(entry.key)}" data-nc-type="${entry.type}">Del</button>`;
      html += `</td>`;
      html += `</tr>`;
    }

    if (entries.length === 0) {
      html = `<tr><td colspan="4" style="text-align:center;color:#666;padding:20px">No entries found</td></tr>`;
    }

    this.tableBody.innerHTML = html;
  }

  private showAddDialog(): void {
    this.showModal('Add Entry', {
      type: this.activeType !== 'all' ? this.activeType : 'localStorage',
      key: '',
      value: '',
    }, (data) => {
      this.core.setItem(data.type as StorageType, data.key, data.value);
      this.refreshTable();
    });
  }

  private showEditDialog(type: StorageType, key: string): void {
    const entries = this.core.getEntries();
    const entry = entries.find((e) => e.type === type && e.key === key);
    if (!entry) return;

    this.showModal('Edit Entry', {
      type: entry.type,
      key: entry.key,
      value: entry.value,
    }, (data) => {
      this.core.setItem(data.type as StorageType, data.key, data.value);
      this.refreshTable();
    });
  }

  private showModal(
    title: string,
    defaults: { type: string; key: string; value: string },
    onSave: (data: { type: string; key: string; value: string }) => void,
  ): void {
    const overlay = document.createElement('div');
    overlay.className = 'nc-modal-overlay';
    overlay.innerHTML = `
      <div class="nc-modal">
        <h3>${escapeHTML(title)}</h3>
        <label>Type</label>
        <select class="nc-modal-type">
          <option value="localStorage" ${defaults.type === 'localStorage' ? 'selected' : ''}>localStorage</option>
          <option value="sessionStorage" ${defaults.type === 'sessionStorage' ? 'selected' : ''}>sessionStorage</option>
          <option value="cookie" ${defaults.type === 'cookie' ? 'selected' : ''}>cookie</option>
        </select>
        <label>Key</label>
        <input type="text" class="nc-modal-key" value="${escapeHTML(defaults.key)}" />
        <label>Value</label>
        <textarea class="nc-modal-value" rows="3">${escapeHTML(defaults.value)}</textarea>
        <div class="nc-modal-btns">
          <button class="nc-modal-cancel">Cancel</button>
          <button class="nc-primary nc-modal-save">Save</button>
        </div>
      </div>
    `;

    this.container.appendChild(overlay);

    overlay.querySelector('.nc-modal-cancel')!.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('.nc-modal-save')!.addEventListener('click', () => {
      const type = (overlay.querySelector('.nc-modal-type') as HTMLSelectElement).value;
      const key = (overlay.querySelector('.nc-modal-key') as HTMLInputElement).value;
      const value = (overlay.querySelector('.nc-modal-value') as HTMLTextAreaElement).value;
      if (key) {
        onSave({ type, key, value });
      }
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
    this.container.innerHTML = '';
  }
}
