import type { NextConsoleConfig, PanelTab, LogLevel, LogEntry, NetworkEntry } from './types';
import { MainPanel } from './ui/main-panel';

export type { NextConsoleConfig, PanelTab, LogLevel, LogEntry, NetworkEntry };
export type {
  ConsoleOptions,
  NetworkOptions,
  StorageOptions,
  StorageType,
  StorageEntry,
  HttpMethod,
  RequestType,
  SSEEvent,
  SystemInfo,
  PerformanceMetrics,
} from './types';

/** Track singleton instance to prevent multiple hook conflicts */
let _instance: NextConsole | null = null;

/**
 * NextConsole - Next-generation front-end debugging console.
 *
 * @example
 * ```js
 * import NextConsole from 'nextconsole';
 *
 * const nc = new NextConsole();
 * nc.show();
 *
 * // AI streaming log
 * nc.appendStream('stream-1', 'Hello ');
 * nc.appendStream('stream-1', 'world!');
 * nc.endStream('stream-1');
 *
 * // Cleanup
 * nc.destroy();
 * ```
 */
export class NextConsole {
  private panel: MainPanel;

  constructor(config?: NextConsoleConfig) {
    // Auto-destroy previous instance to prevent hook conflicts
    if (_instance) {
      _instance.destroy();
    }
    _instance = this;
    this.panel = new MainPanel(config);
    this.panel.init();
  }

  /** Show the debugging panel */
  show(): void {
    this.panel.show();
  }

  /** Hide the debugging panel */
  hide(): void {
    this.panel.hide();
  }

  /** Toggle panel visibility */
  toggle(): void {
    this.panel.toggle();
  }

  /** Check if the panel is currently visible */
  get isVisible(): boolean {
    return this.panel.isVisible();
  }

  /**
   * Append a chunk to an AI streaming log.
   * Call with the same streamId to update the entry in-place.
   */
  appendStream(streamId: string, chunk: string): void {
    this.panel.getConsoleCore().appendStream(streamId, chunk);
  }

  /** Mark a streaming log as complete */
  endStream(streamId: string): void {
    this.panel.getConsoleCore().endStream(streamId);
  }

  /** Clear all console logs */
  clearConsole(): void {
    this.panel.getConsoleCore().clear();
  }

  /** Clear all network entries */
  clearNetwork(): void {
    this.panel.getNetworkCore().clear();
  }

  /** Export console logs as JSON string */
  exportLogs(): string {
    return this.panel.getConsoleCore().exportJSON();
  }

  /** Get all captured console log entries */
  getLogEntries(): LogEntry[] {
    return this.panel.getConsoleCore().getEntries();
  }

  /** Get all captured network entries */
  getNetworkEntries(): NetworkEntry[] {
    return this.panel.getNetworkCore().getEntries();
  }

  /**
   * Completely destroy NextConsole.
   * Restores original console, fetch, XHR, and EventSource.
   * Safe to call in production to remove all traces.
   */
  destroy(): void {
    if (_instance === this) {
      _instance = null;
    }
    this.panel.destroy();
  }
}

// Default export
export default NextConsole;
