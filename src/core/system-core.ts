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
  if (typeof performance === 'undefined') return undefined;

  const metrics: PerformanceMetrics = {};

  // Use Navigation Timing Level 2 (performance.timing is deprecated)
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      if (nav.loadEventEnd > 0) {
        metrics.pageLoadTime = Math.round(nav.loadEventEnd - nav.startTime);
      }
      if (nav.domContentLoadedEventEnd > 0) {
        metrics.domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      }
    }
  } catch {
    // Navigation Timing API not available
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
