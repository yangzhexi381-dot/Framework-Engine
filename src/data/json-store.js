function assertJsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object') throw new TypeError('Expected a JSON value');

  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Expected a plain JSON object');
  }
  if (ancestors.has(value)) throw new TypeError('Circular JSON value');
  ancestors.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) throw new TypeError('Sparse arrays are not JSON values');
      assertJsonValue(value[index], ancestors);
    }
  } else {
    for (const entry of Object.values(value)) assertJsonValue(entry, ancestors);
  }
  ancestors.delete(value);
}

export function serialize(value) {
  assertJsonValue(value);
  return JSON.stringify(value);
}

export function deserialize(text) {
  if (typeof text !== 'string') throw new TypeError('Expected JSON text');
  const value = JSON.parse(text);
  assertJsonValue(value);
  return value;
}

export function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

export function createJsonStore(storage) {
  if (typeof storage?.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Storage must provide getItem(key) and setItem(key, value)');
  }

  function read(key, fallback = null) {
    const text = storage.getItem(key);
    return text === null ? fallback : deserialize(text);
  }

  function write(key, value) {
    storage.setItem(key, serialize(value));
  }

  function update(key, transform, fallback = null) {
    const next = transform(read(key, fallback));
    write(key, next);
    return next;
  }

  return Object.freeze({read, write, update});
}
