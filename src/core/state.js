import {createEventBus} from './events.js';
import {deserialize, serialize} from '../data/json-store.js';

export function createState(initial) {
  const changes = createEventBus();
  let snapshot = serialize(initial);
  let updating = false;

  function get() {
    return deserialize(snapshot);
  }

  function update(transform) {
    if (updating) throw new Error('State updates cannot be nested');
    updating = true;
    try {
      const previous = snapshot;
      snapshot = serialize(transform(get()));
      const errors = changes.emit('change', {previous, current: snapshot});
      return {value: get(), errors};
    } finally {
      updating = false;
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Expected a state listener');
    return changes.on('change', ({previous, current}) =>
      listener(deserialize(current), deserialize(previous)));
  }

  return Object.freeze({get, update, subscribe});
}
