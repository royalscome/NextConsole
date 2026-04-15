import { getSystemInfo } from '../core/system-core';
import { escapeHTML } from '../utils/dom';

/**
 * System info panel displaying UA, screen, memory, network, and performance data.
 */
export class SystemPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="nc-toolbar">
        <button class="nc-toolbar-btn nc-system-refresh">↻ Refresh</button>
      </div>
      <div class="nc-system-list"></div>
    `;

    this.container.querySelector('.nc-system-refresh')!.addEventListener('click', () => {
      this.refreshInfo();
    });

    this.refreshInfo();
  }

  private refreshInfo(): void {
    const info = getSystemInfo();
    const list = this.container.querySelector('.nc-system-list')!;

    const rows: [string, string][] = [
      ['User Agent', info.userAgent],
      ['Platform', info.platform],
      ['Language', info.language],
      ['Screen', `${info.screenWidth} × ${info.screenHeight}`],
      ['Viewport', `${info.viewportWidth} × ${info.viewportHeight}`],
      ['Device Pixel Ratio', String(info.devicePixelRatio)],
    ];

    if (info.deviceMemory !== undefined) {
      rows.push(['Device Memory', `${info.deviceMemory} GB`]);
    }
    if (info.hardwareConcurrency !== undefined) {
      rows.push(['CPU Cores', String(info.hardwareConcurrency)]);
    }
    if (info.connectionType) {
      rows.push(['Network Type', info.connectionType]);
    }

    if (info.performance) {
      const p = info.performance;
      if (p.pageLoadTime !== undefined) rows.push(['Page Load', `${p.pageLoadTime}ms`]);
      if (p.domContentLoaded !== undefined) rows.push(['DOM Content Loaded', `${p.domContentLoaded}ms`]);
      if (p.firstPaint !== undefined) rows.push(['First Paint', `${p.firstPaint}ms`]);
      if (p.firstContentfulPaint !== undefined) rows.push(['First Contentful Paint', `${p.firstContentfulPaint}ms`]);
      if (p.usedJSHeapSize !== undefined) {
        rows.push(['JS Heap Used', `${(p.usedJSHeapSize / 1048576).toFixed(1)} MB`]);
      }
      if (p.totalJSHeapSize !== undefined) {
        rows.push(['JS Heap Total', `${(p.totalJSHeapSize / 1048576).toFixed(1)} MB`]);
      }
    }

    let html = '';
    for (const [key, val] of rows) {
      html += `<div class="nc-system-row">`;
      html += `<div class="nc-system-key">${escapeHTML(key)}</div>`;
      html += `<div class="nc-system-val">${escapeHTML(val)}</div>`;
      html += `</div>`;
    }

    list.innerHTML = html;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
