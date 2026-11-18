export function createEventBus({ onError = console.error } = {}) {
  const topics = new Map();
  const queue = [];
  let delivering = false;

  return {
    subscribe(topic, listener) {
      if (typeof listener !== 'function') throw new TypeError('Expected an event listener');
      const listeners = topics.get(topic) ?? new Set();
      topics.set(topic, listeners);
      // Separate subscriptions may use the same callback and unsubscribe independently.
      const subscription = { listener };
      listeners.add(subscription);
      return () => {
        listeners.delete(subscription);
        if (topics.get(topic) === listeners && listeners.size === 0) topics.delete(topic);
      };
    },

    publish(topic, payload) {
      queue.push({ topic, payload });
      if (delivering) return;
      delivering = true;
      try {
        for (const event of queue) {
          for (const { listener } of [...(topics.get(event.topic) ?? [])]) {
            try {
              listener(event.payload);
            } catch (error) {
              try { onError(error, event.topic); } catch { /* Keep delivering. */ }
            }
          }
        }
      } finally {
        queue.length = 0;
        delivering = false;
      }
    }
  };
}
