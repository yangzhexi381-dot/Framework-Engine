import { createEventBus } from './events.js';
import { createJsonDocument, createMemoryStorage } from '../data/json-document.js';
import { createStateStore } from '../data/state-store.js';
import { createModuleRegistry } from '../modules/registry.js';

const stateFormat = 'framework-engine-state';

export class FrameworkEngine {
  #plugins = new Map();
  #getStorage;
  #prefix;
  #activeId = null;
  #store = null;

  constructor({ storage, getStorage, prefix = 'fe-v01:', onEventError } = {}) {
    const memory = createMemoryStorage();
    this.#getStorage = getStorage ?? (() => storage ?? globalThis.localStorage ?? memory);
    this.#prefix = prefix;
    this.events = createEventBus({ onError: onEventError });
    this.modules = createModuleRegistry({ events: this.events });
  }

  get activeId() { return this.#activeId; }
  get state() { return this.#store ? this.#store.read() : null; }

  register(plugin) {
    const { manifest, initialState, validateState, reduce } = plugin ?? {};
    const id = manifest?.id;
    if (typeof id !== 'string' || !id.trim() || [initialState, validateState, reduce].some(fn => typeof fn !== 'function')) {
      throw new TypeError('Invalid framework plugin contract');
    }
    if (this.#plugins.has(id)) throw new Error(`Framework already registered: ${id}`);
    this.#plugins.set(id, { manifest: structuredClone(manifest), initialState, validateState, reduce });
  }

  list() {
    return [...this.#plugins.values()].map(plugin => structuredClone(plugin.manifest));
  }

  load(id, { restore = true } = {}) {
    const plugin = this.#plugins.get(id);
    if (!plugin) throw new Error(`Unknown framework: ${id}`);
    const document = createJsonDocument({ getStorage: this.#getStorage, key: this.#prefix + id });
    const store = createStateStore({
      document,
      initialState: plugin.initialState,
      validateState: plugin.validateState,
      restore,
      onChange: state => this.events.publish('state:changed', { frameworkId: id, state })
    });
    this.#store = store;
    this.#activeId = id;
    const snapshot = this.snapshot();
    this.events.publish('framework:loaded', this.snapshot());
    return snapshot;
  }

  unload() {
    if (!this.#store) return false;
    const frameworkId = this.#activeId;
    this.#store = null;
    this.#activeId = null;
    this.events.publish('framework:unloaded', { frameworkId });
    return true;
  }

  snapshot() {
    return { frameworkId: this.activeId, state: this.state };
  }

  #requireStore() {
    if (!this.#store) throw new Error('No framework loaded');
    return this.#store;
  }

  dispatch(action) {
    const store = this.#requireStore();
    const id = this.#activeId;
    const { reduce } = this.#plugins.get(id);
    return { frameworkId: id, state: store.update(state => reduce(state, action)) };
  }

  reset() {
    const store = this.#requireStore();
    const frameworkId = this.#activeId;
    return { frameworkId, state: store.reset() };
  }

  exportData() {
    this.#requireStore();
    return JSON.stringify({ format: stateFormat, version: 1, ...this.snapshot() }, null, 2);
  }

  importData(json) {
    const store = this.#requireStore();
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (data?.format !== stateFormat || data.version !== 1) throw new Error('Unsupported import format/version');
    if (data.frameworkId !== this.#activeId) throw new Error('Import belongs to a different framework');
    return { frameworkId: data.frameworkId, state: store.replace(data.state) };
  }
}
