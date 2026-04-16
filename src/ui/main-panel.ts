import type { PanelTab, NextConsoleConfig } from '../types';
import { ConsoleCore } from '../core/console-core';
import { NetworkCore } from '../core/network-core';
import { StorageCore } from '../core/storage-core';
import { ElementCore } from '../core/element-core';
import { FloatButton } from './float-button';
import { ConsolePanel } from './console-panel';
import { NetworkPanel } from './network-panel';
import { StoragePanel } from './storage-panel';
import { ElementPanel } from './element-panel';
import { SystemPanel } from './system-panel';
import { THEME_CSS } from '../styles/theme';
import { on, clamp } from '../utils/dom';

const TABS: { key: PanelTab; label: string }[] = [
  { key: 'console', label: 'Console' },
  { key: 'network', label: 'Network' },
  { key: 'storage', label: 'Storage' },
  { key: 'element', label: 'Element' },
  { key: 'system', label: 'System' },
];

/**
 * Main panel shell: manages shadow DOM, tabs, resizing, and sub-panels.
 */
export class MainPanel {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private panelEl!: HTMLElement;
  private tabContentEl!: HTMLElement;
  private activeTab: PanelTab;
  private visible = false;
  private cleanups: (() => void)[] = [];

  // Core modules
  private consoleCore: ConsoleCore;
  private networkCore: NetworkCore;
  private storageCore: StorageCore;
  private elementCore: ElementCore;

  // UI modules
  private floatButton!: FloatButton;
  private consolePanel?: ConsolePanel;
  private networkPanel?: NetworkPanel;
  private storagePanel?: StoragePanel;
  private elementPanel?: ElementPanel;
  private systemPanel?: SystemPanel;

  // Config
  private config: NextConsoleConfig;

  constructor(config: NextConsoleConfig = {}) {
    this.config = config;
    this.activeTab = config.defaultTab || 'console';

    // Create isolated host element with Shadow DOM
    this.host = document.createElement('div');
    this.host.id = 'nextconsole-host';
    this.shadow = this.host.attachShadow({ mode: 'closed' });

    // Core modules
    this.consoleCore = new ConsoleCore(config.console);
    this.networkCore = new NetworkCore(config.network);
    this.storageCore = new StorageCore(config.storage);
    this.elementCore = new ElementCore();
  }

  /** Initialize everything */
  init(): void {
    const target = this.config.target || document.body;
    target.appendChild(this.host);

    // Inject styles
    const style = document.createElement('style');
    style.textContent = THEME_CSS;
    this.shadow.appendChild(style);

    // Create float button
    this.floatButton = new FloatButton(
      this.shadow,
      () => this.toggle(),
      this.config.buttonPosition,
    );

    // Create panel
    this.createPanel();

    // Init cores
    this.consoleCore.init();
    this.networkCore.init();
    this.storageCore.init();
    this.elementCore.init();

    // Apply initial panel height
    if (this.config.panelHeight) {
      const h = clamp(this.config.panelHeight, 0.1, 0.9);
      this.panelEl.style.setProperty('--nc-panel-height', `${h * 100}vh`);
    }

    this.config.onReady?.();
  }

  private createPanel(): void {
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'nc-panel';

    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'nc-resize-handle';
    this.panelEl.appendChild(resizeHandle);
    this.bindResize(resizeHandle);

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'nc-tab-bar';

    for (const tab of TABS) {
      const tabEl = document.createElement('div');
      tabEl.className = `nc-tab${tab.key === this.activeTab ? ' nc-tab-active' : ''}`;
      tabEl.textContent = tab.label;
      tabEl.dataset.ncTab = tab.key;
      tabBar.appendChild(tabEl);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nc-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.hide());
    tabBar.appendChild(closeBtn);

    this.panelEl.appendChild(tabBar);

    // Tab content area
    this.tabContentEl = document.createElement('div');
    this.tabContentEl.className = 'nc-tab-content';

    for (const tab of TABS) {
      const pane = document.createElement('div');
      pane.className = `nc-tab-pane${tab.key === this.activeTab ? ' nc-tab-pane-active' : ''}`;
      pane.dataset.ncPane = tab.key;
      pane.style.display = 'flex';
      pane.style.flexDirection = 'column';
      if (tab.key !== this.activeTab) {
        pane.style.display = 'none';
      }
      this.tabContentEl.appendChild(pane);
    }
    this.panelEl.appendChild(this.tabContentEl);

    this.shadow.appendChild(this.panelEl);

    // Bind tab switching
    tabBar.addEventListener('click', (e) => {
      const tabEl = (e.target as HTMLElement).closest('[data-nc-tab]') as HTMLElement;
      if (tabEl) {
        this.switchTab(tabEl.dataset.ncTab as PanelTab);
      }
    });

    // Initialize active tab's panel
    this.activatePanel(this.activeTab);
  }

  private switchTab(tab: PanelTab): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;

    // Update tab bar
    this.shadow.querySelectorAll('.nc-tab').forEach((el) => {
      (el as HTMLElement).classList.toggle('nc-tab-active', (el as HTMLElement).dataset.ncTab === tab);
    });

    // Update panes
    this.shadow.querySelectorAll('.nc-tab-pane').forEach((el) => {
      const isActive = (el as HTMLElement).dataset.ncPane === tab;
      (el as HTMLElement).style.display = isActive ? 'flex' : 'none';
      (el as HTMLElement).classList.toggle('nc-tab-pane-active', isActive);
    });

    this.activatePanel(tab);
  }

  private activatePanel(tab: PanelTab): void {
    const pane = this.shadow.querySelector(`[data-nc-pane="${tab}"]`) as HTMLElement;
    if (!pane) return;

    switch (tab) {
      case 'console':
        if (!this.consolePanel) {
          this.consolePanel = new ConsolePanel(pane, this.consoleCore);
        }
        break;
      case 'network':
        if (!this.networkPanel) {
          this.networkPanel = new NetworkPanel(pane, this.networkCore);
        }
        break;
      case 'storage':
        if (!this.storagePanel) {
          this.storagePanel = new StoragePanel(pane, this.storageCore);
        } else {
          this.storagePanel.refreshTable();
        }
        break;
      case 'element':
        if (!this.elementPanel) {
          this.elementPanel = new ElementPanel(pane, this.elementCore);
        }
        break;
      case 'system':
        if (!this.systemPanel) {
          this.systemPanel = new SystemPanel(pane);
        }
        break;
    }
  }

  private bindResize(handle: HTMLElement): void {
    let startY = 0;
    let startHeight = 0;
    let dragging = false;

    const onMove = (clientY: number) => {
      if (!dragging) return;
      const delta = startY - clientY;
      const newHeight = clamp(startHeight + delta, 100, window.innerHeight - 60);
      this.panelEl.style.height = `${newHeight}px`;
    };

    const onEnd = () => {
      dragging = false;
    };

    handle.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      startHeight = this.panelEl.offsetHeight;
    });

    handle.addEventListener('touchstart', (e) => {
      dragging = true;
      startY = e.touches[0].clientY;
      startHeight = this.panelEl.offsetHeight;
    }, { passive: true });

    this.cleanups.push(
      on(window as any, 'mousemove', (e: MouseEvent) => onMove(e.clientY)),
      on(window as any, 'mouseup', onEnd),
      on(window as any, 'touchmove', (e: TouchEvent) => onMove(e.touches[0].clientY)),
      on(window as any, 'touchend', onEnd),
    );
  }

  /** Show the panel */
  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.panelEl.classList.add('nc-panel-visible');
    this.floatButton.hide();
  }

  /** Hide the panel */
  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.panelEl.classList.remove('nc-panel-visible');
    this.floatButton.show();
  }

  /** Toggle panel visibility */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** Check if panel is visible */
  isVisible(): boolean {
    return this.visible;
  }

  /** Get the console core for API access */
  getConsoleCore(): ConsoleCore {
    return this.consoleCore;
  }

  /** Get the network core for API access */
  getNetworkCore(): NetworkCore {
    return this.networkCore;
  }

  /** Get the storage core for API access */
  getStorageCore(): StorageCore {
    return this.storageCore;
  }

  /** Completely destroy and clean up */
  destroy(): void {
    this.consolePanel?.destroy();
    this.networkPanel?.destroy();
    this.storagePanel?.destroy();
    this.elementPanel?.destroy();
    this.systemPanel?.destroy();
    this.floatButton.destroy();
    this.consoleCore.destroy();
    this.networkCore.destroy();
    this.storageCore.destroy();
    this.elementCore.destroy();
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
    this.host.remove();
  }
}
