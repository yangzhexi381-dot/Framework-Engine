import {createEventBus} from './core/events.js';
import {createState} from './core/state.js';
import {createJsonStore, createMemoryStorage} from './data/json-store.js';
import {createModuleRegistry} from './modules/registry.js';

export {createMemoryStorage, deserialize, serialize} from './data/json-store.js';

export function createEngine({initialState = {}, storage = createMemoryStorage()} = {}) {
  const services = Object.freeze({
    state: createState(initialState),
    events: createEventBus(),
    data: createJsonStore(storage)
  });
  const modules = createModuleRegistry(services);

  function connect(adapter) {
    if (typeof adapter?.connect !== 'function') throw new TypeError('Expected a Framework adapter');
    return adapter.connect(services);
  }

  return Object.freeze({...services, modules, connect});
}
