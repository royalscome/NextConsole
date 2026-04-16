import type { NetworkEntry, NetworkOptions, SSEEvent, StreamMessage } from '../types';
import { EventEmitter } from '../utils/event-emitter';
import { nextId } from '../utils/time';

type NetworkEvents = {
  request: (entry: NetworkEntry) => void;
  update: (entry: NetworkEntry) => void;
  clear: () => void;
};

const DEFAULT_OPTIONS: NetworkOptions = {
  maxRequests: 500,
  hookFetch: true,
  hookXHR: true,
  hookSSE: true,
  hookWebSocket: true,
};

const MAX_MESSAGES = 1000;

/** Serialize request body for display */
function serializeBody(body: unknown): unknown {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return body.toString();
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const obj: Record<string, string> = {};
    body.forEach((v, k) => { obj[k] = typeof v === 'string' ? v : `[File: ${(v as File).name}]`; });
    return obj;
  }
  if (typeof Blob !== 'undefined' && body instanceof Blob) return `[Blob: ${body.size} bytes]`;
  if (body instanceof ArrayBuffer) return `[ArrayBuffer: ${body.byteLength} bytes]`;
  if (ArrayBuffer.isView(body)) return `[${body.constructor.name}: ${body.byteLength} bytes]`;
  return String(body);
}

/**
 * NetworkCore hooks into fetch, XMLHttpRequest, and EventSource
 * to capture network activity including SSE streams.
 */
export class NetworkCore extends EventEmitter<NetworkEvents> {
  private entries: NetworkEntry[] = [];
  private options: NetworkOptions;
  private originalFetch: typeof window.fetch | null = null;
  private originalXHR: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private originalXHRSetHeader: typeof XMLHttpRequest.prototype.setRequestHeader | null = null;
  private originalEventSource: typeof EventSource | null = null;
  private originalWebSocket: typeof WebSocket | null = null;
  private hooked = false;

  constructor(options?: Partial<NetworkOptions>) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  init(): void {
    if (this.hooked) return;
    if (this.options.hookFetch) this.hookFetch();
    if (this.options.hookXHR) this.hookXHR();
    if (this.options.hookSSE) this.hookSSE();
    if (this.options.hookWebSocket) this.hookWebSocket();
    this.hooked = true;
  }

  private hookFetch(): void {
    this.originalFetch = window.fetch.bind(window);
    const self = this;
    const origFetch = this.originalFetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      const requestHeaders: Record<string, string> = {};

      if (init?.headers) {
        const h = new Headers(init.headers);
        h.forEach((v, k) => (requestHeaders[k] = v));
      }

      const entry: NetworkEntry = {
        id: nextId(),
        type: 'fetch',
        method,
        url,
        requestHeaders,
        requestBody: serializeBody(init?.body),
        status: 0,
        statusText: '',
        responseHeaders: {},
        responseBody: null,
        startTime: performance.now(),
        endTime: 0,
        duration: 0,
        pending: true,
      };

      self.addEntry(entry);

      try {
        const response = await origFetch(input, init);

        entry.status = response.status;
        entry.statusText = response.statusText;
        response.headers.forEach((v, k) => (entry.responseHeaders[k] = v));
        entry.endTime = performance.now();
        entry.duration = entry.endTime - entry.startTime;
        entry.pending = false;

        // Clone response to read body without consuming it
        const clone = response.clone();
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            entry.responseBody = await clone.json();
          } else {
            const text = await clone.text();
            entry.responseBody = text.length > 10000 ? text.slice(0, 10000) + '...(truncated)' : text;
          }
        } catch {
          entry.responseBody = '[Unable to read body]';
        }

        self.emit('update', entry);
        return response;
      } catch (err) {
        entry.endTime = performance.now();
        entry.duration = entry.endTime - entry.startTime;
        entry.pending = false;
        entry.error = err instanceof Error ? err.message : String(err);
        self.emit('update', entry);
        throw err;
      }
    };
  }

  private hookXHR(): void {
    const self = this;
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    this.originalXHR = origOpen;
    this.originalXHRSend = origSend;
    this.originalXHRSetHeader = origSetHeader;

    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest & { _nc_entry?: NetworkEntry; _nc_headers?: Record<string, string> },
      method: string,
      url: string | URL,
    ) {
      this._nc_headers = {};
      this._nc_entry = {
        id: nextId(),
        type: 'xhr',
        method: method.toUpperCase(),
        url: String(url),
        requestHeaders: this._nc_headers,
        requestBody: null,
        status: 0,
        statusText: '',
        responseHeaders: {},
        responseBody: null,
        startTime: 0,
        endTime: 0,
        duration: 0,
        pending: true,
      };

      return origOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (
      this: XMLHttpRequest & { _nc_headers?: Record<string, string> },
      name: string,
      value: string,
    ) {
      if (this._nc_headers) {
        this._nc_headers[name] = value;
      }
      return origSetHeader.call(this, name, value);
    };

    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest & { _nc_entry?: NetworkEntry },
      body?: Document | XMLHttpRequestBodyInit | null,
    ) {
      const entry = this._nc_entry;
      if (entry) {
        entry.startTime = performance.now();
        entry.requestBody = serializeBody(body);
        self.addEntry(entry);

        this.addEventListener('loadend', () => {
          entry.status = this.status;
          entry.statusText = this.statusText;
          entry.endTime = performance.now();
          entry.duration = entry.endTime - entry.startTime;
          entry.pending = false;

          // Parse response headers
          const headerStr = this.getAllResponseHeaders();
          if (headerStr) {
            headerStr.split('\r\n').forEach((line) => {
              const idx = line.indexOf(':');
              if (idx > 0) {
                entry.responseHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
              }
            });
          }

          try {
            const ct = this.getResponseHeader('content-type') || '';
            if (ct.includes('application/json')) {
              entry.responseBody = JSON.parse(this.responseText);
            } else {
              const text = this.responseText;
              entry.responseBody = text.length > 10000 ? text.slice(0, 10000) + '...(truncated)' : text;
            }
          } catch {
            entry.responseBody = this.responseText || '[Unable to read body]';
          }

          self.emit('update', entry);
        });

        this.addEventListener('error', () => {
          entry.endTime = performance.now();
          entry.duration = entry.endTime - entry.startTime;
          entry.pending = false;
          entry.error = 'Network Error';
          self.emit('update', entry);
        });
      }

      return origSend.call(this, body);
    };
  }

  private hookSSE(): void {
    if (typeof EventSource === 'undefined') return;
    const self = this;
    const OrigES = EventSource;
    this.originalEventSource = OrigES;

    const ProxiedES = function (this: EventSource, url: string | URL, init?: EventSourceInit) {
      const es = new OrigES(url, init);
      const entry: NetworkEntry = {
        id: nextId(),
        type: 'sse',
        method: 'GET',
        url: String(url),
        requestHeaders: {},
        requestBody: null,
        status: 0,
        statusText: 'SSE',
        responseHeaders: {},
        responseBody: null,
        startTime: performance.now(),
        endTime: 0,
        duration: 0,
        pending: true,
        sseEvents: [],
        messages: [],
      };

      self.addEntry(entry);

      es.addEventListener('open', () => {
        entry.status = 200;
        self.emit('update', entry);
      });

      // Capture all messages (including named events via onmessage)
      const origAddEventListener = es.addEventListener.bind(es);
      (es as any).addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        if (type !== 'open' && type !== 'error' && type !== 'message') {
          // Wrap to capture named events (message events are captured by the internal handler below)
          const wrappedListener = function (e: Event) {
            const me = e as MessageEvent;
            const sseEvent: SSEEvent = {
              data: me.data,
              timestamp: Date.now(),
              id: me.lastEventId || undefined,
              event: type === 'message' ? undefined : type,
            };
            entry.sseEvents!.push(sseEvent);
            const msg: StreamMessage = {
              direction: 'in',
              data: me.data,
              timestamp: Date.now(),
              event: type === 'message' ? undefined : type,
              size: typeof me.data === 'string' ? me.data.length : 0,
            };
            if (entry.messages!.length >= MAX_MESSAGES) {
              entry.messages!.splice(0, entry.messages!.length - MAX_MESSAGES + 100);
            }
            entry.messages!.push(msg);
            self.emit('update', entry);

            if (typeof listener === 'function') {
              listener.call(es, e);
            } else {
              listener.handleEvent(e);
            }
          };
          return origAddEventListener(type, wrappedListener as EventListener, options);
        }
        return origAddEventListener(type, listener, options);
      };

      // Capture all messages via original addEventListener to avoid double recording
      origAddEventListener('message', ((e: MessageEvent) => {
        const sseEvent: SSEEvent = {
          data: e.data,
          timestamp: Date.now(),
          id: e.lastEventId || undefined,
        };
        entry.sseEvents!.push(sseEvent);
        const msg: StreamMessage = {
          direction: 'in',
          data: e.data,
          timestamp: Date.now(),
          size: typeof e.data === 'string' ? e.data.length : 0,
        };
        if (entry.messages!.length >= MAX_MESSAGES) {
          entry.messages!.splice(0, entry.messages!.length - MAX_MESSAGES + 100);
        }
        entry.messages!.push(msg);
        self.emit('update', entry);
      }) as EventListener);

      es.addEventListener('error', () => {
        entry.pending = false;
        entry.endTime = performance.now();
        entry.duration = entry.endTime - entry.startTime;
        entry.error = 'SSE Connection Error';
        self.emit('update', entry);
      });

      return es;
    } as unknown as typeof EventSource;

    Object.defineProperties(ProxiedES, {
      CONNECTING: { value: OrigES.CONNECTING },
      OPEN: { value: OrigES.OPEN },
      CLOSED: { value: OrigES.CLOSED },
      prototype: { value: OrigES.prototype },
    });

    (window as any).EventSource = ProxiedES;
  }

  private hookWebSocket(): void {
    if (typeof WebSocket === 'undefined') return;
    const self = this;
    const OrigWS = WebSocket;
    this.originalWebSocket = OrigWS;

    const ProxiedWS = function (this: WebSocket, url: string | URL, protocols?: string | string[]) {
      const ws = new OrigWS(url, protocols);
      const entry: NetworkEntry = {
        id: nextId(),
        type: 'websocket',
        method: 'WS',
        url: String(url),
        requestHeaders: {},
        requestBody: null,
        status: 0,
        statusText: 'WebSocket',
        responseHeaders: {},
        responseBody: null,
        startTime: performance.now(),
        endTime: 0,
        duration: 0,
        pending: true,
        messages: [],
      };

      self.addEntry(entry);

      ws.addEventListener('open', () => {
        entry.status = 101;
        entry.statusText = 'Switching Protocols';
        self.emit('update', entry);
      });

      ws.addEventListener('message', (e: MessageEvent) => {
        const data = typeof e.data === 'string' ? e.data : '[Binary]';
        const msg: StreamMessage = {
          direction: 'in',
          data,
          timestamp: Date.now(),
          size: typeof e.data === 'string' ? e.data.length : (e.data as ArrayBuffer)?.byteLength || 0,
        };
        if (entry.messages!.length >= MAX_MESSAGES) {
          entry.messages!.splice(0, entry.messages!.length - MAX_MESSAGES + 100);
        }
        entry.messages!.push(msg);
        self.emit('update', entry);
      });

      ws.addEventListener('close', (e: CloseEvent) => {
        entry.pending = false;
        entry.endTime = performance.now();
        entry.duration = entry.endTime - entry.startTime;
        entry.statusText = `Closed (${e.code})`;
        self.emit('update', entry);
      });

      ws.addEventListener('error', () => {
        entry.pending = false;
        entry.endTime = performance.now();
        entry.duration = entry.endTime - entry.startTime;
        entry.error = 'WebSocket Error';
        self.emit('update', entry);
      });

      // Hook send to capture outgoing messages
      const origSend = ws.send.bind(ws);
      ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        const text = typeof data === 'string' ? data : '[Binary]';
        const msg: StreamMessage = {
          direction: 'out',
          data: text,
          timestamp: Date.now(),
          size: typeof data === 'string' ? data.length : (data as ArrayBuffer)?.byteLength || 0,
        };
        if (entry.messages!.length >= MAX_MESSAGES) {
          entry.messages!.splice(0, entry.messages!.length - MAX_MESSAGES + 100);
        }
        entry.messages!.push(msg);
        self.emit('update', entry);
        return origSend(data);
      };

      return ws;
    } as unknown as typeof WebSocket;

    Object.defineProperties(ProxiedWS, {
      CONNECTING: { value: OrigWS.CONNECTING },
      OPEN: { value: OrigWS.OPEN },
      CLOSING: { value: OrigWS.CLOSING },
      CLOSED: { value: OrigWS.CLOSED },
      prototype: { value: OrigWS.prototype },
    });

    (window as any).WebSocket = ProxiedWS;
  }

  private addEntry(entry: NetworkEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.options.maxRequests) {
      this.entries.splice(0, this.entries.length - this.options.maxRequests);
    }
    this.emit('request', entry);
  }

  getEntries(): NetworkEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries.length = 0;
    this.emit('clear');
  }

  destroy(): void {
    if (!this.hooked) return;

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHR) {
      XMLHttpRequest.prototype.open = this.originalXHR;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }
    if (this.originalXHRSetHeader) {
      XMLHttpRequest.prototype.setRequestHeader = this.originalXHRSetHeader;
    }
    if (this.originalEventSource) {
      (window as any).EventSource = this.originalEventSource;
    }
    if (this.originalWebSocket) {
      (window as any).WebSocket = this.originalWebSocket;
    }

    this.hooked = false;
    this.removeAllListeners();
  }
}
