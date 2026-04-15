import { clamp, on } from '../utils/dom';

/**
 * Draggable floating button with edge-snapping.
 */
export class FloatButton {
  private el: HTMLElement;
  private cleanups: (() => void)[] = [];
  private isDragging = false;
  private dragStarted = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(
    private container: ShadowRoot,
    private onClick: () => void,
    position?: { x: number; y: number },
  ) {
    this.el = document.createElement('button');
    this.el.className = 'nc-float-btn';
    this.el.textContent = 'NC';
    this.el.setAttribute('aria-label', 'Toggle NextConsole');

    // Default position: bottom-right
    const x = position?.x ?? window.innerWidth - 64;
    const y = position?.y ?? window.innerHeight - 100;
    this.setPosition(x, y);

    container.appendChild(this.el);
    this.bindEvents();
  }

  private setPosition(x: number, y: number): void {
    const maxX = window.innerWidth - 48;
    const maxY = window.innerHeight - 48;
    this.el.style.left = `${clamp(x, 0, maxX)}px`;
    this.el.style.top = `${clamp(y, 0, maxY)}px`;
  }

  private bindEvents(): void {
    // Touch events for mobile
    this.cleanups.push(
      on(this.el, 'touchstart', (e: TouchEvent) => {
        e.preventDefault();
        this.isDragging = true;
        this.dragStarted = false;
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.offsetX = this.el.offsetLeft;
        this.offsetY = this.el.offsetTop;
      }, { passive: false }),
    );

    this.cleanups.push(
      on(window as any, 'touchmove', (e: TouchEvent) => {
        if (!this.isDragging) return;
        const touch = e.touches[0];
        const dx = touch.clientX - this.startX;
        const dy = touch.clientY - this.startY;

        if (!this.dragStarted && Math.abs(dx) + Math.abs(dy) > 5) {
          this.dragStarted = true;
        }

        if (this.dragStarted) {
          this.setPosition(this.offsetX + dx, this.offsetY + dy);
        }
      }, { passive: true }),
    );

    this.cleanups.push(
      on(window as any, 'touchend', () => {
        if (this.isDragging) {
          if (!this.dragStarted) {
            this.onClick();
          } else {
            this.snapToEdge();
          }
          this.isDragging = false;
          this.dragStarted = false;
        }
      }),
    );

    // Mouse events for desktop
    this.cleanups.push(
      on(this.el, 'mousedown', (e: MouseEvent) => {
        e.preventDefault();
        this.isDragging = true;
        this.dragStarted = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.offsetX = this.el.offsetLeft;
        this.offsetY = this.el.offsetTop;
      }),
    );

    this.cleanups.push(
      on(window as any, 'mousemove', (e: MouseEvent) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        if (!this.dragStarted && Math.abs(dx) + Math.abs(dy) > 5) {
          this.dragStarted = true;
        }

        if (this.dragStarted) {
          this.setPosition(this.offsetX + dx, this.offsetY + dy);
        }
      }),
    );

    this.cleanups.push(
      on(window as any, 'mouseup', () => {
        if (this.isDragging) {
          if (!this.dragStarted) {
            this.onClick();
          } else {
            this.snapToEdge();
          }
          this.isDragging = false;
          this.dragStarted = false;
        }
      }),
    );
  }

  /** Snap button to nearest horizontal edge */
  private snapToEdge(): void {
    const x = this.el.offsetLeft;
    const midX = window.innerWidth / 2;
    const targetX = x < midX ? 8 : window.innerWidth - 56;
    this.el.style.transition = 'left 0.2s ease';
    this.el.style.left = `${targetX}px`;
    setTimeout(() => {
      this.el.style.transition = '';
    }, 200);
  }

  show(): void {
    this.el.style.display = 'flex';
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
    this.el.remove();
  }
}
