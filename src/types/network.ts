/** HTTP method types */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | string;

/** Request type */
export type RequestType = 'fetch' | 'xhr' | 'sse' | 'websocket';

/** Network request entry */
export interface NetworkEntry {
  id: number;
  type: RequestType;
  method: HttpMethod;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  startTime: number;
  endTime: number;
  duration: number;
  /** For SSE: accumulated events */
  sseEvents?: SSEEvent[];
  /** For SSE/WebSocket: real-time messages */
  messages?: StreamMessage[];
  /** Whether the request is still pending */
  pending: boolean;
  error?: string;
}

/** Server-Sent Event */
export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  timestamp: number;
}

/** Real-time stream message (SSE/WebSocket) */
export interface StreamMessage {
  direction: 'in' | 'out';
  data: string;
  timestamp: number;
  event?: string;
  size?: number;
}

/** Network panel options */
export interface NetworkOptions {
  /** Maximum number of requests to keep */
  maxRequests: number;
  /** Whether to hook fetch */
  hookFetch: boolean;
  /** Whether to hook XMLHttpRequest */
  hookXHR: boolean;
  /** Whether to hook EventSource */
  hookSSE: boolean;
  /** Whether to hook WebSocket */
  hookWebSocket: boolean;
}
