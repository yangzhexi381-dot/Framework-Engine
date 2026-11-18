export function createMemoryStorage() {
  const entries = new Map();
  return {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: key => { entries.delete(key); }
  };
}

export function encodeJson(value) {
  return JSON.stringify(value, (_key, entry) => {
    if (entry === null || typeof entry === 'string' || typeof entry === 'boolean' ||
        Number.isFinite(entry) || typeof entry === 'object') return entry;
    throw new TypeError('Expected JSON data');
  });
}

export function createJsonDocument({ getStorage, key }) {
  return {
    read() {
      const raw = getStorage().getItem(key);
      return raw === null ? undefined : JSON.parse(raw);
    },

    replace(value) {
      const raw = encodeJson(value);
      const snapshot = JSON.parse(raw);
      getStorage().setItem(key, raw);
      return snapshot;
    },

    remove() {
      getStorage().removeItem(key);
    }
  };
}
