export function createModuleRegistry({ events }) {
  const registered = new Map();
  const loaded = new Map();
  let changing = false;

  function assertIdle() {
    if (changing) throw new Error('Cannot mutate registry during a lifecycle hook');
  }

  function plan(id, stack = new Set(), ordered = new Set()) {
    const entry = registered.get(id);
    if (!entry) throw new Error(`Unknown module: ${id}`);
    if (stack.has(id)) throw new Error(`Circular module dependency: ${[...stack, id].join(' -> ')}`);
    if (loaded.has(id) || ordered.has(id)) return ordered;
    stack.add(id);
    for (const dependency of entry.dependencies) plan(dependency, stack, ordered);
    stack.delete(id);
    ordered.add(id);
    return ordered;
  }

  function invokeSync(hook, argument) {
    const result = hook?.(argument);
    if (typeof result?.then === 'function') {
      // Observe rejection even though an asynchronous hook violates the contract.
      Promise.resolve(result).catch(() => {});
      throw new TypeError('Module lifecycle hooks must be synchronous');
    }
    return result;
  }

  return {
    register({ id, dependencies = [], load, unload }) {
      assertIdle();
      if (typeof id !== 'string' || !id.trim() || !Array.isArray(dependencies) ||
          dependencies.some(dep => typeof dep !== 'string' || !dep.trim()) ||
          typeof load !== 'function' || (unload !== undefined && typeof unload !== 'function')) {
        throw new TypeError('Invalid module contract');
      }
      if (registered.has(id)) throw new Error(`Module already registered: ${id}`);
      registered.set(id, { dependencies: [...new Set(dependencies)], load, unload });
    },

    isLoaded: id => loaded.has(id),

    load(id) {
      assertIdle();
      const order = plan(id);
      const started = [];
      changing = true;
      try {
        for (const moduleId of order) {
          const entry = registered.get(moduleId);
          const dependencies = new Map(entry.dependencies.map(dep => [dep, loaded.get(dep)]));
          loaded.set(moduleId, invokeSync(entry.load, { events, dependencies }));
          started.push(moduleId);
        }
        return loaded.get(id);
      } catch (error) {
        const errors = [error];
        for (const moduleId of started.reverse()) {
          try {
            invokeSync(registered.get(moduleId).unload, loaded.get(moduleId));
          } catch (cleanupError) {
            errors.push(cleanupError);
          } finally {
            loaded.delete(moduleId);
          }
        }
        if (errors.length > 1) throw new AggregateError(errors, 'Module load and rollback failed');
        throw error;
      } finally {
        changing = false;
      }
    },

    unload(id) {
      assertIdle();
      if (!loaded.has(id)) return false;
      for (const moduleId of loaded.keys()) {
        if (registered.get(moduleId).dependencies.includes(id)) {
          throw new Error(`Cannot unload ${id} while ${moduleId} is loaded`);
        }
      }
      changing = true;
      try {
        invokeSync(registered.get(id).unload, loaded.get(id));
        loaded.delete(id);
        return true;
      } finally {
        changing = false;
      }
    }
  };
}
