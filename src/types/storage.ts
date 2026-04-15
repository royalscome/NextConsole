/** Storage type */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookie';

/** Storage entry */
export interface StorageEntry {
  key: string;
  value: string;
  type: StorageType;
  /** Cookie-specific fields */
  domain?: string;
  path?: string;
  expires?: string;
  secure?: boolean;
  sameSite?: string;
  httpOnly?: boolean;
}

/** Storage panel options */
export interface StorageOptions {
  /** Whether to show localStorage */
  showLocalStorage: boolean;
  /** Whether to show sessionStorage */
  showSessionStorage: boolean;
  /** Whether to show cookies */
  showCookies: boolean;
}
