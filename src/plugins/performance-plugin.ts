import type { NextConsolePlugin, PluginAPI } from '../types/plugin';
import { escapeHTML } from '../utils/dom';

interface PerfMetric {
  name: string;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface ResourceEntry {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
}

const PERF_CSS = `
.nc-perf-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.nc-perf-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}
.nc-perf-section {
  margin-bottom: 12px;
}
.nc-perf-section-title {
  font-size: 12px;
  font-weight: bold;
  color: var(--nc-text);
  padding: 6px 0 4px;
  border-bottom: 1px solid var(--nc-border);
  margin-bottom: 6px;
}
.nc-perf-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px;
}
.nc-perf-card {
  background: var(--nc-bg-secondary);
  border: 1px solid var(--nc-border);
  border-radius: var(--nc-radius);
  padding: 8px 10px;
  border-left: 3px solid var(--nc-border);
}
.nc-perf-card-good { border-left-color: #3dc9b0; }
.nc-perf-card-needs-improvement { border-left-color: #cca700; }
.nc-perf-card-poor { border-left-color: #f14c4c; }
.nc-perf-card-name {
  font-size: 10px;
  color: var(--nc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.nc-perf-card-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--nc-text);
  margin: 2px 0;
}
.nc-perf-card-unit {
  font-size: 11px;
  color: var(--nc-text-secondary);
  font-weight: normal;
}
.nc-perf-bar-wrap {
  display: flex;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
  gap: 6px;
}
.nc-perf-bar-label {
  flex-shrink: 0;
  width: 100px;
  color: var(--nc-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nc-perf-bar-track {
  flex: 1;
  height: 14px;
  background: var(--nc-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}
.nc-perf-bar-fill {
  height: 100%;
  border-radius: 2px;
  min-width: 1px;
}
.nc-perf-bar-fill-script { background: #2b5b84; }
.nc-perf-bar-fill-css { background: #5b3a84; }
.nc-perf-bar-fill-img { background: #3a845b; }
.nc-perf-bar-fill-font { background: #845b3a; }
.nc-perf-bar-fill-other { background: #555; }
.nc-perf-bar-value {
  flex-shrink: 0;
  width: 60px;
  text-align: right;
  color: var(--nc-text-muted);
}
.nc-perf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.nc-perf-table th {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--nc-border);
  color: var(--nc-text-muted);
  font-weight: normal;
  text-transform: uppercase;
  font-size: 10px;
  position: sticky;
  top: 0;
  background: var(--nc-bg);
}
.nc-perf-table td {
  padding: 3px 8px;
  border-bottom: 1px solid var(--nc-border);
  color: var(--nc-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
.nc-perf-table tr:hover td {
  background: var(--nc-bg-hover);
}
.nc-perf-empty {
  text-align: center;
  color: var(--nc-text-muted);
  padding: 16px;
}
.nc-perf-mark-btn {
  padding: 2px 8px;
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  color: var(--nc-text);
  cursor: pointer;
  border-radius: var(--nc-radius);
  font-size: 11px;
  margin-left: 6px;
}
.nc-perf-mark-btn:hover { background: var(--nc-bg-hover); }
`;

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatBytes(b: number): string {
  if (b <= 0) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function rateMetric(name: string, value: number): PerfMetric['rating'] {
  // Based on Web Vitals thresholds
  switch (name) {
    case 'FCP': return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'LCP': return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID': return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS': return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'TTFB': return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    case 'INP': return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    default: return 'good';
  }
}

function getResourceType(entry: PerformanceResourceTiming): string {
  const ext = entry.name.split('?')[0].split('.').pop()?.toLowerCase() || '';
  if (['js', 'mjs'].includes(ext) || entry.initiatorType === 'script') return 'script';
  if (['css'].includes(ext) || entry.initiatorType === 'css' || entry.initiatorType === 'link') return 'css';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif'].includes(ext) || entry.initiatorType === 'img') return 'img';
  if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'font';
  return 'other';
}

function getShortName(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.split('/').pop() || u.pathname;
    return path.length > 40 ? path.slice(0, 37) + '...' : path;
  } catch {
    return url.slice(0, 40);
  }
}

function collectCoreMetrics(): PerfMetric[] {
  const metrics: PerfMetric[] = [];

  // Navigation Timing
  const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (navEntries.length > 0) {
    const nav = navEntries[0];

    const ttfb = nav.responseStart - nav.requestStart;
    if (ttfb > 0) metrics.push({ name: 'TTFB', value: ttfb, unit: 'ms', rating: rateMetric('TTFB', ttfb) });

    const domReady = nav.domContentLoadedEventEnd - nav.startTime;
    if (domReady > 0) metrics.push({ name: 'DOM Ready', value: domReady, unit: 'ms', rating: rateMetric('FCP', domReady) });

    const load = nav.loadEventEnd - nav.startTime;
    if (load > 0) metrics.push({ name: 'Load', value: load, unit: 'ms', rating: rateMetric('LCP', load) });

    const dnsTime = nav.domainLookupEnd - nav.domainLookupStart;
    if (dnsTime > 0) metrics.push({ name: 'DNS', value: dnsTime, unit: 'ms', rating: 'good' });

    const tcpTime = nav.connectEnd - nav.connectStart;
    if (tcpTime > 0) metrics.push({ name: 'TCP', value: tcpTime, unit: 'ms', rating: 'good' });
  }

  // Paint Timing
  const paintEntries = performance.getEntriesByType('paint');
  for (const entry of paintEntries) {
    if (entry.name === 'first-paint') {
      metrics.push({ name: 'FP', value: entry.startTime, unit: 'ms', rating: rateMetric('FCP', entry.startTime) });
    }
    if (entry.name === 'first-contentful-paint') {
      metrics.push({ name: 'FCP', value: entry.startTime, unit: 'ms', rating: rateMetric('FCP', entry.startTime) });
    }
  }

  // Memory
  const mem = (performance as any).memory;
  if (mem) {
    metrics.push({ name: 'JS Heap', value: mem.usedJSHeapSize / (1024 * 1024), unit: 'MB', rating: mem.usedJSHeapSize / mem.jsHeapSizeLimit > 0.9 ? 'poor' : 'good' });
    metrics.push({ name: 'Heap Limit', value: mem.jsHeapSizeLimit / (1024 * 1024), unit: 'MB', rating: 'good' });
  }

  return metrics;
}

function collectResources(): ResourceEntry[] {
  return (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
    .map((r) => ({
      name: r.name,
      type: getResourceType(r),
      duration: r.duration,
      size: r.transferSize || 0,
      startTime: r.startTime,
    }))
    .sort((a, b) => b.duration - a.duration);
}

function collectLongTasks(): { startTime: number; duration: number }[] {
  // Long tasks from PerformanceObserver are not stored in the buffer by default,
  // but we can check existing long-task entries if available.
  try {
    return (performance.getEntriesByType('longtask') as PerformanceEntry[])
      .map((e) => ({ startTime: e.startTime, duration: e.duration }))
      .sort((a, b) => b.duration - a.duration);
  } catch {
    return [];
  }
}

export function createPerformancePlugin(): NextConsolePlugin {
  let container: HTMLElement;
  let longTaskObserver: PerformanceObserver | null = null;
  let longTasks: { startTime: number; duration: number }[] = [];
  let customMarks: string[] = [];

  function render() {
    const metrics = collectCoreMetrics();
    const resources = collectResources();
    const storedLongTasks = [...longTasks, ...collectLongTasks()];
    // Deduplicate by startTime
    const uniqueLT = new Map<number, { startTime: number; duration: number }>();
    for (const lt of storedLongTasks) uniqueLT.set(lt.startTime, lt);
    const sortedLT = [...uniqueLT.values()].sort((a, b) => b.duration - a.duration);

    // Resource summary
    const summary = new Map<string, { count: number; totalSize: number; totalDuration: number }>();
    for (const r of resources) {
      const s = summary.get(r.type) || { count: 0, totalSize: 0, totalDuration: 0 };
      s.count++;
      s.totalSize += r.size;
      s.totalDuration += r.duration;
      summary.set(r.type, s);
    }

    const maxDuration = resources.length > 0 ? Math.max(...resources.map((r) => r.duration), 1) : 1;

    // Core metrics cards
    const metricsHTML = metrics.length > 0
      ? metrics.map((m) => `
        <div class="nc-perf-card nc-perf-card-${m.rating}">
          <div class="nc-perf-card-name">${escapeHTML(m.name)}</div>
          <div class="nc-perf-card-value">${m.unit === 'ms' ? formatMs(m.value) : m.value.toFixed(1)}<span class="nc-perf-card-unit"> ${m.unit === 'ms' ? '' : m.unit}</span></div>
        </div>`).join('')
      : '<div class="nc-perf-empty">No metrics available yet</div>';

    // Resource summary bars
    const typeOrder = ['script', 'css', 'img', 'font', 'other'];
    const totalSize = resources.reduce((a, r) => a + r.size, 0);
    const summaryHTML = typeOrder
      .filter((t) => summary.has(t))
      .map((t) => {
        const s = summary.get(t)!;
        const pct = totalSize > 0 ? (s.totalSize / totalSize * 100) : 0;
        return `<div class="nc-perf-bar-wrap">
          <span class="nc-perf-bar-label">${t} (${s.count})</span>
          <div class="nc-perf-bar-track"><div class="nc-perf-bar-fill nc-perf-bar-fill-${t}" style="width:${Math.max(pct, 1)}%"></div></div>
          <span class="nc-perf-bar-value">${formatBytes(s.totalSize)}</span>
        </div>`;
      }).join('');

    // Top resources table
    const topResources = resources.slice(0, 30);
    const resourceRows = topResources.map((r) => `
      <tr>
        <td title="${escapeHTML(r.name)}">${escapeHTML(getShortName(r.name))}</td>
        <td>${r.type}</td>
        <td>${formatMs(r.duration)}</td>
        <td>${formatBytes(r.size)}</td>
      </tr>`).join('');

    // Long tasks
    const longTaskHTML = sortedLT.length > 0
      ? sortedLT.slice(0, 20).map((lt) => `
        <tr>
          <td>${formatMs(lt.startTime)}</td>
          <td style="color:${lt.duration > 100 ? 'var(--nc-error)' : 'var(--nc-warn)'}">${formatMs(lt.duration)}</td>
        </tr>`).join('')
      : '';

    // Custom marks
    const marks = performance.getEntriesByType('mark');
    const marksHTML = marks.length > 0
      ? marks.map((m) => `
        <tr>
          <td>${escapeHTML(m.name)}</td>
          <td>${formatMs(m.startTime)}</td>
        </tr>`).join('')
      : '';

    container.innerHTML = `
      <div class="nc-perf-view">
        <div class="nc-toolbar">
          <button class="nc-toolbar-btn nc-perf-refresh">Refresh</button>
          <button class="nc-perf-mark-btn nc-perf-mark">+ Mark</button>
        </div>
        <div class="nc-perf-scroll">
          <div class="nc-perf-section">
            <div class="nc-perf-section-title">Core Metrics</div>
            <div class="nc-perf-metrics">${metricsHTML}</div>
          </div>

          ${summaryHTML ? `
          <div class="nc-perf-section">
            <div class="nc-perf-section-title">Resource Breakdown (${resources.length} resources, ${formatBytes(totalSize)} total)</div>
            ${summaryHTML}
          </div>` : ''}

          ${resourceRows ? `
          <div class="nc-perf-section">
            <div class="nc-perf-section-title">Slowest Resources</div>
            <table class="nc-perf-table">
              <tr><th>Name</th><th>Type</th><th>Duration</th><th>Size</th></tr>
              ${resourceRows}
            </table>
          </div>` : ''}

          ${longTaskHTML ? `
          <div class="nc-perf-section">
            <div class="nc-perf-section-title">Long Tasks (${sortedLT.length})</div>
            <table class="nc-perf-table">
              <tr><th>Start</th><th>Duration</th></tr>
              ${longTaskHTML}
            </table>
          </div>` : ''}

          ${marksHTML ? `
          <div class="nc-perf-section">
            <div class="nc-perf-section-title">Performance Marks</div>
            <table class="nc-perf-table">
              <tr><th>Name</th><th>Time</th></tr>
              ${marksHTML}
            </table>
          </div>` : ''}
        </div>
      </div>`;

    container.querySelector('.nc-perf-refresh')!.addEventListener('click', render);
    container.querySelector('.nc-perf-mark')!.addEventListener('click', () => {
      const name = `nc-mark-${customMarks.length + 1}`;
      performance.mark(name);
      customMarks.push(name);
      render();
    });
  }

  return {
    name: 'performance',
    version: '1.0.0',
    init() {
      // Start observing long tasks
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({ startTime: entry.startTime, duration: entry.duration });
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch {
        // Long Task API not supported
      }
    },
    tab: {
      label: 'Perf',
      render(el, api) {
        container = el;
        api.addStyle(PERF_CSS);
        render();
      },
      destroy() {
        container.innerHTML = '';
      },
    },
    destroy() {
      longTaskObserver?.disconnect();
      longTaskObserver = null;
      longTasks = [];
      // Clean up custom marks
      for (const name of customMarks) {
        try { performance.clearMarks(name); } catch { /* noop */ }
      }
      customMarks = [];
    },
  };
}
