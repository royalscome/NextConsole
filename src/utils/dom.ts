const NC_PREFIX = 'nc-';

/** Create a DOM element with optional attributes and children */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }
  return el;
}

/** Add namespaced class */
export function ncClass(...names: string[]): string {
  return names.map((n) => `${NC_PREFIX}${n}`).join(' ');
}

/** Set innerHTML safely within shadow DOM (no external leak) */
export function setHTML(el: HTMLElement, html: string): void {
  el.innerHTML = html;
}

/** Query within a container */
export function $(selector: string, container: ParentNode = document): HTMLElement | null {
  return container.querySelector(selector);
}

/** Query all within a container */
export function $$(selector: string, container: ParentNode = document): HTMLElement[] {
  return Array.from(container.querySelectorAll(selector));
}

/** Attach event listener and return cleanup function */
export function on<K extends keyof HTMLElementEventMap>(
  el: EventTarget,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void {
  el.addEventListener(event, handler as EventListener, options);
  return () => el.removeEventListener(event, handler as EventListener, options);
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Escape HTML entities to prevent XSS */
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
