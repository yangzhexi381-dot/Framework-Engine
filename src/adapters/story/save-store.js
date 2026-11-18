import { createJsonDocument } from '../../data/json-document.js';

// The story owns its existing keys, save envelopes, and deletion prompts.
export function createStorySaveStore({ getStorage }) {
  const document = key => createJsonDocument({ getStorage, key });
  return {
    read: key => document(key).read() ?? null,
    write: (key, value) => document(key).replace(value),
    remove: key => document(key).remove()
  };
}
