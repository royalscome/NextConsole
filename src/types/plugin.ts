import type { ConsoleCore } from '../core/console-core';
import type { NetworkCore } from '../core/network-core';
import type { StorageCore } from '../core/storage-core';

/** API surface exposed to plugins */
export interface PluginAPI {
  /** Access to the console core module */
  consoleCore: ConsoleCore;
  /** Access to the network core module */
  networkCore: NetworkCore;
  /** Access to the storage core module */
  storageCore: StorageCore;
  /** Inject custom CSS into the Shadow DOM */
  addStyle(css: string): void;
  /** Log messages through NextConsole's console */
  log(...args: unknown[]): void;
  /** Show the panel */
  show(): void;
  /** Hide the panel */
  hide(): void;
}

/** Tab configuration for plugins that add a panel */
export interface PluginTab {
  /** Tab display label */
  label: string;
  /** Render the panel content into the given container element */
  render(container: HTMLElement, api: PluginAPI): void;
  /** Called when the panel is destroyed */
  destroy?(): void;
}

/** Plugin definition */
export interface NextConsolePlugin {
  /** Unique plugin name (used as tab key and for deduplication) */
  name: string;
  /** Plugin version string */
  version?: string;
  /** Register a custom tab panel (optional) */
  tab?: PluginTab;
  /** Called when the plugin is installed; receives the plugin API */
  init?(api: PluginAPI): void;
  /** Called when NextConsole is destroyed */
  destroy?(): void;
}
