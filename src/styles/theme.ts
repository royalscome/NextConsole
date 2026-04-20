/** CSS theme variables and base styles injected into shadow DOM */
export const THEME_CSS = `
:host {
  --nc-bg: #1e1e1e;
  --nc-bg-secondary: #252526;
  --nc-bg-hover: #2a2d2e;
  --nc-bg-active: #37373d;
  --nc-border: #3c3c3c;
  --nc-text: #cccccc;
  --nc-text-secondary: #999999;
  --nc-text-muted: #666666;
  --nc-accent: #0078d4;
  --nc-accent-hover: #1a8cff;
  --nc-log: #d4d4d4;
  --nc-info: #3dc9b0;
  --nc-warn: #cca700;
  --nc-error: #f14c4c;
  --nc-debug: #9cdcfe;
  --nc-font: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  --nc-font-size: 12px;
  --nc-radius: 4px;
  --nc-panel-height: 40vh;
  --nc-btn-size: 48px;
  --nc-shadow: 0 2px 8px rgba(0,0,0,0.4);
  --nc-modal-overlay: rgba(0,0,0,0.5);
  --nc-scrollbar-hover: #555;

  font-family: var(--nc-font);
  font-size: var(--nc-font-size);
  color: var(--nc-text);
  line-height: 1.5;
}

/* Light Theme */
:host(.nc-theme-light) {
  --nc-bg: #ffffff;
  --nc-bg-secondary: #f5f5f5;
  --nc-bg-hover: #e8e8e8;
  --nc-bg-active: #dcdcdc;
  --nc-border: #d4d4d4;
  --nc-text: #1e1e1e;
  --nc-text-secondary: #616161;
  --nc-text-muted: #9e9e9e;
  --nc-accent: #0066cc;
  --nc-accent-hover: #0055aa;
  --nc-log: #333333;
  --nc-info: #098658;
  --nc-warn: #9d6e00;
  --nc-error: #cd3131;
  --nc-debug: #0451a5;
  --nc-shadow: 0 2px 12px rgba(0,0,0,0.15);
  --nc-modal-overlay: rgba(0,0,0,0.3);
  --nc-scrollbar-hover: #aaa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Float Button */
.nc-float-btn {
  position: fixed;
  z-index: 2147483647;
  width: var(--nc-btn-size);
  height: var(--nc-btn-size);
  border-radius: 50%;
  background: var(--nc-accent);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  font-family: var(--nc-font);
  box-shadow: var(--nc-shadow);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: background 0.2s;
}
.nc-float-btn:active {
  background: var(--nc-accent-hover);
}

/* Panel Container */
.nc-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nc-panel-height);
  z-index: 2147483646;
  background: var(--nc-bg);
  border-top: 1px solid var(--nc-border);
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.25s ease;
}
.nc-panel.nc-panel-visible {
  transform: translateY(0);
}

/* Resize Handle */
.nc-resize-handle {
  height: 6px;
  cursor: ns-resize;
  background: var(--nc-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nc-resize-handle::after {
  content: '';
  width: 32px;
  height: 3px;
  background: var(--nc-border);
  border-radius: 2px;
}

/* Tab Bar */
.nc-tab-bar {
  display: flex;
  background: var(--nc-bg-secondary);
  border-bottom: 1px solid var(--nc-border);
  flex-shrink: 0;
  align-items: stretch;
}
.nc-tabs-scroll {
  display: flex;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.nc-tab {
  padding: 6px 14px;
  cursor: pointer;
  color: var(--nc-text-secondary);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  font-size: 12px;
  font-family: var(--nc-font);
  transition: color 0.15s, border-color 0.15s;
  user-select: none;
  -webkit-user-select: none;
  flex-shrink: 0;
}
.nc-close-btn {
  padding: 4px 10px;
  cursor: pointer;
  color: var(--nc-text-secondary);
  font-size: 16px;
  font-family: var(--nc-font);
  background: none;
  border: none;
  flex-shrink: 0;
  line-height: 1;
}
.nc-close-btn:hover {
  color: var(--nc-error);
}
.nc-tab:hover {
  color: var(--nc-text);
}
.nc-tab.nc-tab-active {
  color: var(--nc-accent);
  border-bottom-color: var(--nc-accent);
}

/* Tab Content */
.nc-tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.nc-tab-pane {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: auto;
  display: none;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
}
.nc-tab-pane.nc-tab-pane-active {
  display: flex;
}

/* Toolbar */
.nc-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--nc-bg-secondary);
  border-bottom: 1px solid var(--nc-border);
  flex-shrink: 0;
}
.nc-toolbar input[type="text"] {
  flex: 1;
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  color: var(--nc-text);
  padding: 3px 8px;
  border-radius: var(--nc-radius);
  font-size: 11px;
  font-family: var(--nc-font);
  outline: none;
  min-width: 0;
}
.nc-toolbar input[type="text"]:focus {
  border-color: var(--nc-accent);
}
.nc-toolbar-btn {
  padding: 3px 8px;
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  color: var(--nc-text-secondary);
  cursor: pointer;
  border-radius: var(--nc-radius);
  font-size: 11px;
  font-family: var(--nc-font);
  white-space: nowrap;
  transition: background 0.15s;
}
.nc-toolbar-btn:hover {
  background: var(--nc-bg-hover);
  color: var(--nc-text);
}
.nc-toolbar-btn.nc-active {
  background: var(--nc-accent);
  color: #fff;
  border-color: var(--nc-accent);
}

/* Console Panel */
.nc-console-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.nc-log-entry {
  padding: 4px 8px;
  border-bottom: 1px solid var(--nc-border);
  font-family: var(--nc-font);
  font-size: var(--nc-font-size);
  word-break: break-all;
  white-space: pre-wrap;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.4;
}
.nc-log-entry:hover {
  background: var(--nc-bg-hover);
}
.nc-log-time {
  color: var(--nc-text-muted);
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1.4;
  padding-top: 1px;
}
.nc-log-body {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
}
.nc-log-level-log .nc-log-body { color: var(--nc-log); }
.nc-log-level-info .nc-log-body { color: var(--nc-info); }
.nc-log-level-warn .nc-log-body { color: var(--nc-warn); }
.nc-log-level-error .nc-log-body { color: var(--nc-error); }
.nc-log-level-debug .nc-log-body { color: var(--nc-debug); }
.nc-log-level-warn { background: rgba(204, 167, 0, 0.08); }
.nc-log-level-error { background: rgba(241, 76, 76, 0.08); }
.nc-log-streaming {
  border-left: 2px solid var(--nc-accent);
}

/* Network Panel */
.nc-network-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  table-layout: fixed;
}
.nc-network-table th {
  position: sticky;
  top: 0;
  background: var(--nc-bg-secondary);
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--nc-border);
  color: var(--nc-text-secondary);
  font-weight: normal;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.nc-network-table th:hover {
  color: var(--nc-text);
}
.nc-network-table td {
  padding: 4px 8px;
  border-bottom: 1px solid var(--nc-border);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nc-network-table tr:hover td {
  background: var(--nc-bg-hover);
}
.nc-network-table .nc-status-ok { color: var(--nc-info); }
.nc-network-table .nc-status-err { color: var(--nc-error); }
.nc-network-table .nc-status-pending { color: var(--nc-warn); }

.nc-network-detail {
  padding: 8px;
  border-top: 1px solid var(--nc-border);
  background: var(--nc-bg-secondary);
  overflow: auto;
  max-height: 50%;
}
.nc-detail-section {
  margin-bottom: 8px;
}
.nc-detail-title {
  color: var(--nc-text-secondary);
  font-weight: bold;
  margin-bottom: 4px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.nc-detail-body {
  padding-left: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Messages Stream (SSE/WebSocket) */
.nc-messages-stream {
  max-height: 200px;
  overflow-y: auto;
  padding: 0 !important;
  white-space: normal !important;
}
.nc-msg-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 3px 8px;
  border-bottom: 1px solid var(--nc-border);
  font-size: 11px;
  line-height: 1.4;
}
.nc-msg-row:hover {
  background: var(--nc-bg-hover);
}
.nc-msg-out {
  color: #e07b39;
}
.nc-msg-in {
  color: #3dc9b0;
}
.nc-msg-info {
  color: var(--nc-text-secondary);
  font-style: italic;
  justify-content: center;
}
.nc-msg-arrow {
  flex-shrink: 0;
  font-weight: bold;
  width: 12px;
}
.nc-msg-time {
  flex-shrink: 0;
  color: var(--nc-text-secondary);
  font-size: 10px;
  min-width: 70px;
}
.nc-msg-event {
  flex-shrink: 0;
  color: #a78bfa;
  font-size: 10px;
}
.nc-msg-data {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}
.nc-msg-size {
  flex-shrink: 0;
  color: var(--nc-text-secondary);
  font-size: 10px;
}

/* Storage Panel */
.nc-storage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.nc-storage-table th {
  position: sticky;
  top: 0;
  background: var(--nc-bg-secondary);
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--nc-border);
  color: var(--nc-text-secondary);
  font-weight: normal;
}
.nc-storage-table td {
  padding: 4px 8px;
  border-bottom: 1px solid var(--nc-border);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nc-storage-table td.nc-storage-type {
  white-space: nowrap;
  overflow: visible;
}
.nc-storage-table td:last-child {
  overflow: visible;
  white-space: nowrap;
  width: 1%;
}
.nc-storage-table tr:hover td {
  background: var(--nc-bg-hover);
}
.nc-storage-table tr:hover td:last-child {
  background: transparent;
}
.nc-storage-table tr.nc-storage-expanded td {
  border-bottom: none;
}
.nc-storage-detail {
  background: var(--nc-bg-secondary);
  border-bottom: 1px solid var(--nc-border);
}
.nc-storage-detail td {
  padding: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  max-width: none;
  overflow: visible;
  color: var(--nc-text);
  font-size: 11px;
  line-height: 1.5;
}
.nc-storage-actions {
  display: flex;
  gap: 4px;
}
.nc-storage-actions button {
  padding: 1px 6px;
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  color: var(--nc-text-secondary);
  cursor: pointer;
  border-radius: 2px;
  font-size: 10px;
  font-family: var(--nc-font);
  position: relative;
  z-index: 1;
}
.nc-storage-actions button:hover {
  background: var(--nc-bg-hover);
  color: var(--nc-text);
}
.nc-storage-actions button.nc-danger:hover {
  color: var(--nc-error);
  border-color: var(--nc-error);
}

/* Element Panel */
.nc-element-tree {
  padding: 8px;
  font-size: 12px;
  overflow: auto;
  height: 100%;
}
.nc-dom-node {
  line-height: 1.6;
  cursor: default;
}
.nc-dom-tag { color: #569cd6; }
.nc-dom-attr { color: #9cdcfe; }
.nc-dom-attr-val { color: #ce9178; }
.nc-dom-text { color: #d4d4d4; }
:host(.nc-theme-light) .nc-dom-tag { color: #0000ff; }
:host(.nc-theme-light) .nc-dom-attr { color: #e50000; }
:host(.nc-theme-light) .nc-dom-attr-val { color: #a31515; }
:host(.nc-theme-light) .nc-dom-text { color: #333333; }
:host(.nc-theme-light) .nc-log-level-warn { background: rgba(157, 110, 0, 0.08); }
:host(.nc-theme-light) .nc-log-level-error { background: rgba(205, 49, 49, 0.08); }
:host(.nc-theme-light) .nc-msg-out { color: #c05717; }
:host(.nc-theme-light) .nc-msg-in { color: #098658; }
:host(.nc-theme-light) .nc-msg-event { color: #6f42c1; }
.nc-dom-toggle {
  cursor: pointer;
  display: inline-block;
  width: 12px;
  font-size: 10px;
  transition: transform 0.15s;
}
.nc-dom-toggle.nc-expanded {
  transform: rotate(90deg);
}

/* System Panel */
.nc-system-list {
  padding: 8px;
}
.nc-system-row {
  display: flex;
  padding: 4px 0;
  border-bottom: 1px solid var(--nc-border);
}
.nc-system-key {
  width: 200px;
  flex-shrink: 0;
  color: var(--nc-text-secondary);
}
.nc-system-val {
  flex: 1;
  word-break: break-all;
}

/* Modal/Dialog for storage edit */
.nc-modal-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--nc-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.nc-modal {
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  border-radius: var(--nc-radius);
  padding: 16px;
  min-width: 280px;
  max-width: 90%;
}
.nc-modal h3 {
  color: var(--nc-text);
  font-size: 13px;
  margin-bottom: 12px;
}
.nc-modal label {
  display: block;
  color: var(--nc-text-secondary);
  font-size: 11px;
  margin-bottom: 2px;
}
.nc-modal input, .nc-modal select, .nc-modal textarea {
  width: 100%;
  background: var(--nc-bg-secondary);
  border: 1px solid var(--nc-border);
  color: var(--nc-text);
  padding: 4px 8px;
  border-radius: var(--nc-radius);
  font-size: 12px;
  font-family: var(--nc-font);
  margin-bottom: 8px;
  outline: none;
}
.nc-modal input:focus, .nc-modal textarea:focus {
  border-color: var(--nc-accent);
}
.nc-modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
.nc-modal-btns button {
  padding: 4px 12px;
  border: 1px solid var(--nc-border);
  background: var(--nc-bg-secondary);
  color: var(--nc-text);
  cursor: pointer;
  border-radius: var(--nc-radius);
  font-size: 12px;
  font-family: var(--nc-font);
}
.nc-modal-btns button.nc-primary {
  background: var(--nc-accent);
  border-color: var(--nc-accent);
  color: #fff;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--nc-border);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--nc-scrollbar-hover);
}

/* REPL Panel */
.nc-repl-output {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0;
}
.nc-repl-row {
  padding: 3px 8px;
  border-bottom: 1px solid var(--nc-border);
  font-family: var(--nc-font);
  font-size: var(--nc-font-size);
  word-break: break-all;
  white-space: pre-wrap;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}
.nc-repl-row:hover {
  background: var(--nc-bg-hover);
}
.nc-repl-input-wrap {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border-top: 1px solid var(--nc-border);
  background: var(--nc-bg-secondary);
  flex-shrink: 0;
}
.nc-repl-prompt {
  color: var(--nc-accent);
  font-weight: bold;
  font-family: var(--nc-font);
  font-size: var(--nc-font-size);
  line-height: 1.6;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
}
.nc-repl-input {
  flex: 1;
  background: var(--nc-bg);
  border: 1px solid var(--nc-border);
  color: var(--nc-text);
  padding: 4px 8px;
  border-radius: var(--nc-radius);
  font-size: var(--nc-font-size);
  font-family: var(--nc-font);
  outline: none;
  resize: none;
  line-height: 1.4;
  min-height: 24px;
  max-height: 120px;
  overflow-y: auto;
}
.nc-repl-input:focus {
  border-color: var(--nc-accent);
}
.nc-repl-run {
  padding: 4px 12px;
  background: var(--nc-accent);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: var(--nc-radius);
  font-size: 11px;
  font-family: var(--nc-font);
  font-weight: bold;
  flex-shrink: 0;
  line-height: 1.4;
}
.nc-repl-run:hover {
  background: var(--nc-accent-hover);
}
.nc-repl-code {
  color: var(--nc-text);
  flex: 1;
}
.nc-repl-result {
  color: var(--nc-info);
  flex: 1;
}
.nc-repl-err {
  color: var(--nc-error);
}
.nc-repl-input .nc-repl-row.nc-repl-input {
  color: var(--nc-text-secondary);
}
`;
