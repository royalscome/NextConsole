import { EventEmitter } from '../utils/event-emitter';

export interface ReplEntry {
  id: number;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}

type ReplEvents = {
  entry: (entry: ReplEntry) => void;
  clear: () => void;
};

let _replId = 0;

/**
 * ReplCore executes JavaScript in the page context and captures results.
 */
export class ReplCore extends EventEmitter<ReplEvents> {
  private entries: ReplEntry[] = [];
  private history: string[] = [];
  private maxHistory = 100;

  private addEntry(type: ReplEntry['type'], content: string): ReplEntry {
    const entry: ReplEntry = {
      id: ++_replId,
      type,
      content,
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    this.emit('entry', entry);
    return entry;
  }

  /** Execute a JS expression and return the result */
  execute(code: string): void {
    if (!code.trim()) return;

    // Record input
    this.addEntry('input', code);

    // Save to history
    this.history.push(code);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Execute in global scope
    try {
      // Use indirect eval to execute in global scope
      const indirectEval = eval;
      const result = indirectEval(code);
      this.addEntry('output', this.formatResult(result));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addEntry('error', msg);
    }
  }

  private formatResult(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'function') return `ƒ ${value.name || 'anonymous'}()`;
    if (typeof value === 'symbol') return value.toString();
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (value instanceof HTMLElement) return `<${value.tagName.toLowerCase()}>`;
    if (value instanceof NodeList) return `NodeList(${value.length})`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  getEntries(): ReplEntry[] {
    return this.entries;
  }

  getHistory(): string[] {
    return this.history;
  }

  clear(): void {
    this.entries.length = 0;
    this.emit('clear');
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
