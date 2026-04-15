/** System information */
export interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connectionType?: string;
  /** Performance metrics */
  performance?: PerformanceMetrics;
}

/** Performance metrics */
export interface PerformanceMetrics {
  /** Page load time (ms) */
  pageLoadTime?: number;
  /** DOM content loaded time (ms) */
  domContentLoaded?: number;
  /** First paint time (ms) */
  firstPaint?: number;
  /** First contentful paint time (ms) */
  firstContentfulPaint?: number;
  /** Memory usage (bytes) */
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
}
