import { encodeJson } from './json-document.js';

export function createStateStore({ document, initialState, validateState, restore = true, onChange }) {
  function validate(value) {
    const verdict = validateState(value);
    if (verdict !== true) throw new Error(typeof verdict === 'string' ? verdict : 'Invalid state');
    return value;
  }

  function restoreSaved() {
    try {
      const saved = document.read();
      if (saved !== undefined) return validate(saved);
    } catch { /* Unavailable or invalid stored data uses the default state. */ }
    return undefined;
  }

  let state = restore ? restoreSaved() : undefined;
  if (state === undefined) state = validate(JSON.parse(encodeJson(initialState())));
  let updating = false;

  function update(updater) {
    if (updating) throw new Error('Cannot update state from its own updater');
    updating = true;
    let saved;
    try {
      const value = updater(structuredClone(state));
      const candidate = validate(JSON.parse(encodeJson(value)));
      saved = document.replace(candidate);
      state = saved;
    } finally {
      updating = false;
    }
    onChange?.(structuredClone(saved));
    return structuredClone(saved);
  }

  return {
    read: () => structuredClone(state),
    replace: value => update(() => value),
    update,
    reset: () => update(initialState)
  };
}
