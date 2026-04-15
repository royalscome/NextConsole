import { escapeHTML, ncClass } from '../utils/dom';

/**
 * Simple DOM tree viewer with collapsible nodes and hover highlight.
 */
export class ElementCore {
  private highlightOverlay: HTMLElement | null = null;

  init(): void {
    // Create overlay for element highlighting
    this.highlightOverlay = document.createElement('div');
    Object.assign(this.highlightOverlay.style, {
      position: 'fixed',
      zIndex: '2147483646',
      pointerEvents: 'none',
      border: '2px solid #61dafb',
      backgroundColor: 'rgba(97, 218, 251, 0.1)',
      display: 'none',
    });
    document.body.appendChild(this.highlightOverlay);
  }

  /** Render a collapsible DOM tree starting from a root element */
  renderTree(root: Element = document.documentElement, maxDepth = 8): string {
    return this.renderNode(root, 0, maxDepth);
  }

  private renderNode(node: Element, depth: number, maxDepth: number): string {
    if (depth >= maxDepth) {
      return `<div class="${ncClass('dom-node')}" style="padding-left:${depth * 16}px">...</div>`;
    }

    const tag = node.tagName.toLowerCase();
    const attrs = this.renderAttributes(node);
    const hasChildren = node.children.length > 0;
    const id = `nc-dom-${depth}-${tag}-${Math.random().toString(36).slice(2, 8)}`;

    let html = '';

    if (hasChildren) {
      html += `<div class="${ncClass('dom-node', 'dom-collapsible')}" style="padding-left:${depth * 16}px">`;
      html += `<span class="${ncClass('dom-toggle')}" data-nc-toggle="${id}">▶</span> `;
      html += `<span class="${ncClass('dom-tag')}" data-nc-highlight="${this.getSelector(node)}">&lt;${escapeHTML(tag)}</span>`;
      html += attrs;
      html += `<span class="${ncClass('dom-tag')}">&gt;</span>`;
      html += `</div>`;
      html += `<div class="${ncClass('dom-children')}" id="${id}" style="display:none">`;
      for (let i = 0; i < node.children.length; i++) {
        html += this.renderNode(node.children[i], depth + 1, maxDepth);
      }
      html += `<div class="${ncClass('dom-node')}" style="padding-left:${depth * 16}px">`;
      html += `<span class="${ncClass('dom-tag')}">&lt;/${escapeHTML(tag)}&gt;</span>`;
      html += `</div>`;
      html += `</div>`;
    } else {
      const text = node.textContent?.trim();
      const textPreview = text && text.length > 0 ? escapeHTML(text.slice(0, 60)) : '';
      html += `<div class="${ncClass('dom-node')}" style="padding-left:${depth * 16}px">`;
      html += `<span class="${ncClass('dom-tag')}" data-nc-highlight="${this.getSelector(node)}">&lt;${escapeHTML(tag)}</span>`;
      html += attrs;
      if (textPreview) {
        html += `<span class="${ncClass('dom-tag')}">&gt;</span>`;
        html += `<span class="${ncClass('dom-text')}">${textPreview}</span>`;
        html += `<span class="${ncClass('dom-tag')}">&lt;/${escapeHTML(tag)}&gt;</span>`;
      } else {
        html += `<span class="${ncClass('dom-tag')}">/&gt;</span>`;
      }
      html += `</div>`;
    }

    return html;
  }

  private renderAttributes(node: Element): string {
    let html = '';
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      html += ` <span class="${ncClass('dom-attr')}">${escapeHTML(attr.name)}</span>`;
      html += `=<span class="${ncClass('dom-attr-val')}">"${escapeHTML(attr.value.slice(0, 80))}"</span>`;
    }
    return html;
  }

  private getSelector(el: Element): string {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      return `${tag}.${el.className.split(' ').filter(Boolean).join('.')}`;
    }
    return tag;
  }

  /** Highlight an element in the viewport */
  highlight(selector: string): void {
    if (!this.highlightOverlay) return;
    try {
      // Skip NextConsole's own elements
      const el = document.querySelector(selector);
      if (!el) {
        this.clearHighlight();
        return;
      }
      const rect = el.getBoundingClientRect();
      Object.assign(this.highlightOverlay.style, {
        display: 'block',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    } catch {
      this.clearHighlight();
    }
  }

  clearHighlight(): void {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  destroy(): void {
    if (this.highlightOverlay && this.highlightOverlay.parentNode) {
      this.highlightOverlay.parentNode.removeChild(this.highlightOverlay);
    }
    this.highlightOverlay = null;
  }
}
