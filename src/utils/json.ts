import { escapeHTML } from './dom';

/** Color map for JSON syntax highlighting */
const JSON_COLORS = {
  key: '#9cdcfe',
  string: '#ce9178',
  number: '#b5cea8',
  boolean: '#569cd6',
  null: '#569cd6',
  bracket: '#d4d4d4',
  comma: '#d4d4d4',
};

/**
 * Convert a value to a syntax-highlighted HTML string.
 * Handles circular references and deep nesting safely.
 */
export function highlightJSON(value: unknown, maxDepth = 4): string {
  const seen = new WeakSet();

  function render(val: unknown, depth: number): string {
    if (depth > maxDepth) return span('string', '"[...]"');

    if (val === null) return span('null', 'null');
    if (val === undefined) return span('null', 'undefined');

    const type = typeof val;

    if (type === 'string') {
      return span('string', `"${escapeHTML(val as string)}"`);
    }
    if (type === 'number' || type === 'bigint') {
      return span('number', String(val));
    }
    if (type === 'boolean') {
      return span('boolean', String(val));
    }
    if (type === 'function') {
      return span('string', `"ƒ ${(val as Function).name || 'anonymous'}()"`);
    }
    if (type === 'symbol') {
      return span('string', `"${String(val)}"`);
    }

    if (typeof val === 'object') {
      if (seen.has(val as object)) {
        return span('string', '"[Circular]"');
      }
      seen.add(val as object);

      if (Array.isArray(val)) {
        if (val.length === 0) return span('bracket', '[]');
        const items = val.map((item) => render(item, depth + 1)).join(span('comma', ', '));
        return span('bracket', '[') + items + span('bracket', ']');
      }

      // Object
      const obj = val as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length === 0) return span('bracket', '{}');

      const entries = keys
        .slice(0, 100) // limit keys to prevent huge renders
        .map((k) => {
          const keyStr = span('key', `"${escapeHTML(k)}"`);
          const valStr = render(obj[k], depth + 1);
          return `${keyStr}: ${valStr}`;
        })
        .join(span('comma', ', '));

      const suffix = keys.length > 100 ? span('comma', `, ... +${keys.length - 100}`) : '';
      return span('bracket', '{') + entries + suffix + span('bracket', '}');
    }

    return span('string', escapeHTML(String(val)));
  }

  function span(type: keyof typeof JSON_COLORS, text: string): string {
    return `<span style="color:${JSON_COLORS[type]}">${text}</span>`;
  }

  return render(value, 0);
}

/**
 * Try to parse a string as JSON, return parsed or original.
 */
export function tryParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

/**
 * Stringify a value safely (handles circular refs).
 */
export function safeStringify(value: unknown, space?: number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (typeof val === 'bigint') return val.toString();
      if (typeof val === 'function') return `ƒ ${val.name || 'anonymous'}()`;
      if (typeof val === 'symbol') return val.toString();
      if (val instanceof Error) return { message: val.message, stack: val.stack };
      return val;
    },
    space,
  );
}
