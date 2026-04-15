/**
 * Simple typed event emitter.
 */
export class EventEmitter<Events extends Record<string, (...args: any[]) => void>> {
  private listeners = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(event: K, fn: Events[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Events[K]): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        // Silently catch listener errors to prevent breaking the emitter
      }
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
