/** Log level types */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/** A single log entry */
export interface LogEntry {
  id: number;
  level: LogLevel;
  args: unknown[];
  timestamp: number;
  stack?: string;
  /** For streaming logs: the stream ID this entry belongs to */
  streamId?: string;
  /** Whether this entry is still being streamed */
  streaming?: boolean;
}

/** Console panel options */
export interface ConsoleOptions {
  /** Maximum number of logs to keep in memory */
  maxLogs: number;
  /** Whether to override native console methods */
  hookConsole: boolean;
}
