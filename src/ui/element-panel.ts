import type { ElementCore } from '../core/element-core';

/**
 * Element panel: collapsible DOM tree with hover highlight.
 */
export class ElementPanel {
  private container: HTMLElement;
  private core: ElementCore;
  private treeEl!: HTMLElement;

  constructor(container: HTMLElement, core: ElementCore) {
    this.container = container;
    this.core = core;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="nc-toolbar">
        <button class="nc-toolbar-btn nc-element-refresh">↻ Refresh</button>
      </div>
      <div class="nc-element-tree"></div>
    `;
    this.treeEl = this.container.querySelector('.nc-element-tree') as HTMLElement;
    this.refreshTree();
  }

  private refreshTree(): void {
    this.treeEl.innerHTML = this.core.renderTree(document.documentElement, 6);
  }

  private bindEvents(): void {
    // Refresh
    this.container.querySelector('.nc-element-refresh')!.addEventListener('click', () => {
      this.refreshTree();
    });

    // Toggle collapse
    this.treeEl.addEventListener('click', (e) => {
      const toggle = (e.target as HTMLElement).closest('[data-nc-toggle]') as HTMLElement;
      if (toggle) {
        const targetId = toggle.dataset.ncToggle!;
        const target = this.treeEl.querySelector(`#${targetId}`) as HTMLElement;
        if (target) {
          const isExpanded = target.style.display !== 'none';
          target.style.display = isExpanded ? 'none' : 'block';
          toggle.textContent = isExpanded ? '▶' : '▼';
          toggle.classList.toggle('nc-expanded', !isExpanded);
        }
      }
    });

    // Hover highlight
    this.treeEl.addEventListener('mouseover', (e) => {
      const tag = (e.target as HTMLElement).closest('[data-nc-highlight]') as HTMLElement;
      if (tag) {
        const selector = tag.dataset.ncHighlight!;
        this.core.highlight(selector);
      }
    });

    this.treeEl.addEventListener('mouseout', () => {
      this.core.clearHighlight();
    });
  }

  destroy(): void {
    this.core.clearHighlight();
    this.container.innerHTML = '';
  }
}
