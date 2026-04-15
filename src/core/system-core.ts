import type { SystemInfo, PerformanceMetrics } from '../types';

/**
 * Collect system and performance information.
 */
export function getSystemInfo(): SystemInfo {
  const nav = navigator as any;

  const info: SystemInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  };

  if (nav.deviceMemory) {
    info.deviceMemory = nav.deviceMemory;
  }
  if (nav.hardwareConcurrency) {
    info.hardwareConcurrency = nav.hardwareConcurrency;
  }
  if (nav.connection) {
    info.connectionType = nav.connection.effectiveType || nav.connection.type;
  }

  info.performance = getPerformanceMetrics();
  return info;
}

function getPerformanceMetrics(): PerformanceMetrics | undefined {
  if (!performance || !performance.timing) return undefined;

  const timing = performance.timing;
  const metrics: PerformanceMetrics = {};

  if (timing.loadEventEnd > 0) {
    metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
  }
  if (timing.domContentLoadedEventEnd > 0) {
    metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
  }

  // Paint timings via PerformanceObserver entries
  try {
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = Math.round(entry.startTime);
      }
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = Math.round(entry.startTime);
      }
    }
  } catch {
    // Not supported
  }

  // Memory
  const perf = performance as any;
  if (perf.memory) {
    metrics.usedJSHeapSize = perf.memory.usedJSHeapSize;
    metrics.totalJSHeapSize = perf.memory.totalJSHeapSize;
  }

  return metrics;
}
