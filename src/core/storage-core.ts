import type { StorageEntry, StorageOptions, StorageType } from '../types';
import { EventEmitter } from '../utils/event-emitter';

type StorageEvents = {
  update: () => void;
};

const DEFAULT_OPTIONS: StorageOptions = {
  showLocalStorage: true,
  showSessionStorage: true,
  showCookies: true,
};

/**
 * StorageCore reads and manages localStorage, sessionStorage, and cookies.
 */
export class StorageCore extends EventEmitter<StorageEvents> {
  private options: StorageOptions;

  constructor(options?: Partial<StorageOptions>) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  init(): void {
    // No hooks needed; we read storage on demand
  }

  /** Get all storage entries for visible storage types */
  getEntries(filter?: string): StorageEntry[] {
    const entries: StorageEntry[] = [];

    if (this.options.showLocalStorage) {
      entries.push(...this.readWebStorage('localStorage', filter));
    }
    if (this.options.showSessionStorage) {
      entries.push(...this.readWebStorage('sessionStorage', filter));
    }
    if (this.options.showCookies) {
      entries.push(...this.readCookies(filter));
    }

    return entries;
  }

  private readWebStorage(type: 'localStorage' | 'sessionStorage', filter?: string): StorageEntry[] {
    const entries: StorageEntry[] = [];
    try {
      const storage = type === 'localStorage' ? localStorage : sessionStorage;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key === null) continue;
        if (filter && !key.toLowerCase().includes(filter.toLowerCase())) continue;

        entries.push({
          key,
          value: storage.getItem(key) || '',
          type,
        });
      }
    } catch {
      // Storage may be unavailable (iframe cross-origin, privacy mode, etc.)
    }

    return entries;
  }

  private readCookies(filter?: string): StorageEntry[] {
    const entries: StorageEntry[] = [];
    const cookies = document.cookie;
    if (!cookies) return entries;

    const pairs = cookies.split(';');
    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=');
      if (eqIndex < 0) continue;
      const key = pair.slice(0, eqIndex).trim();
      const rawValue = pair.slice(eqIndex + 1).trim();

      if (filter && !key.toLowerCase().includes(filter.toLowerCase())) continue;

      let value: string;
      try {
        value = decodeURIComponent(rawValue);
      } catch {
        value = rawValue;
      }

      entries.push({
        key,
        value,
        type: 'cookie',
      });
    }

    return entries;
  }

  /** Set a storage value */
  setItem(type: StorageType, key: string, value: string, cookieOptions?: {
    domain?: string;
    path?: string;
    expires?: string;
    secure?: boolean;
    sameSite?: string;
  }): void {
    try {
      if (type === 'localStorage') {
        localStorage.setItem(key, value);
      } else if (type === 'sessionStorage') {
        sessionStorage.setItem(key, value);
      } else if (type === 'cookie') {
        let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        if (cookieOptions?.domain) cookie += `; domain=${cookieOptions.domain}`;
        if (cookieOptions?.path) cookie += `; path=${cookieOptions.path}`;
        else cookie += `; path=/`;
        if (cookieOptions?.expires) cookie += `; expires=${cookieOptions.expires}`;
        if (cookieOptions?.secure) cookie += `; secure`;
        if (cookieOptions?.sameSite) cookie += `; SameSite=${cookieOptions.sameSite}`;
        document.cookie = cookie;
      }
    } catch {
      // Storage may be unavailable
    }
    this.emit('update');
  }

  /** Remove a storage item */
  removeItem(type: StorageType, key: string): void {
    try {
      if (type === 'localStorage') {
        localStorage.removeItem(key);
      } else if (type === 'sessionStorage') {
        sessionStorage.removeItem(key);
      } else if (type === 'cookie') {
        // Try common paths to ensure deletion works
        const paths = ['/', window.location.pathname];
        for (const path of paths) {
          document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
        }
      }
    } catch {
      // Storage may be unavailable
    }
    this.emit('update');
  }

  /** Clear all entries of a specific type */
  clearAll(type: StorageType): void {
    try {
      if (type === 'localStorage') {
        localStorage.clear();
      } else if (type === 'sessionStorage') {
        sessionStorage.clear();
      } else if (type === 'cookie') {
        const entries = this.readCookies();
        for (const entry of entries) {
          this.removeItem('cookie', entry.key);
        }
      }
    } catch {
      // Storage may be unavailable
    }
    this.emit('update');
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
