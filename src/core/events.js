export function createEventBus() {
  const topics = new Map();

  function on(topic, listener) {
    if (typeof listener !== 'function') throw new TypeError('Expected an event listener');
    const listeners = topics.get(topic) ?? new Set();
    const subscription = {listener};
    topics.set(topic, listeners);
    listeners.add(subscription);
    return () => {
      listeners.delete(subscription);
      if (listeners.size === 0 && topics.get(topic) === listeners) topics.delete(topic);
    };
  }

  function emit(topic, payload) {
    const errors = [];
    for (const {listener} of [...(topics.get(topic) ?? [])]) {
      try {
        listener(payload);
      } catch (error) {
        errors.push(error);
      }
    }
    return errors;
  }

  return Object.freeze({on, emit});
}
