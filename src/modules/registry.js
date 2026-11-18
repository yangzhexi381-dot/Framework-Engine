export function createModuleRegistry(services) {
  const definitions = new Map();
  const active = new Map();
  let transitioning = false;

  function assertIdle() {
    if (transitioning) throw new Error('Another module lifecycle operation is in progress');
  }

  function register({id, requires = [], start} = {}) {
    assertIdle();
    if (typeof id !== 'string' || !id.trim()) throw new TypeError('Expected a module ID');
    if (definitions.has(id)) throw new Error('Module already registered: ' + id);
    if (!Array.isArray(requires) || requires.some(dependency =>
      typeof dependency !== 'string' || !dependency.trim())) {
      throw new TypeError('Expected an array of dependency IDs');
    }
    if (start !== undefined && typeof start !== 'function') {
      throw new TypeError('Module start must be a function');
    }
    definitions.set(id, {id, requires: [...new Set(requires)], start});
  }

  function loadOrder(id) {
    const ordered = [];
    const visiting = new Set();
    const visited = new Set();

    function visit(candidate) {
      if (active.has(candidate) || visited.has(candidate)) return;
      if (visiting.has(candidate)) throw new Error('Cyclic module dependency: ' + candidate);
      const definition = definitions.get(candidate);
      if (!definition) throw new Error('Unregistered module dependency: ' + candidate);
      visiting.add(candidate);
      definition.requires.forEach(visit);
      visiting.delete(candidate);
      visited.add(candidate);
      ordered.push(definition);
    }

    visit(id);
    return ordered;
  }

  async function stop(id) {
    await active.get(id)?.();
    active.delete(id);
  }

  function dependentOf(id) {
    return [...active.keys()].find(candidate => definitions.get(candidate).requires.includes(id));
  }

  async function load(id) {
    assertIdle();
    const order = loadOrder(id);
    const started = [];
    transitioning = true;
    try {
      for (const definition of order) {
        const dispose = await definition.start?.(services);
        if (dispose !== undefined && typeof dispose !== 'function') {
          throw new TypeError('Module start must return a disposer or undefined: ' + definition.id);
        }
        active.set(definition.id, dispose);
        started.push(definition.id);
      }
    } catch (loadError) {
      const errors = [loadError];
      for (const moduleId of started.reverse()) {
        if (dependentOf(moduleId)) continue;
        try {
          await stop(moduleId);
        } catch (cleanupError) {
          errors.push(cleanupError);
        }
      }
      if (errors.length > 1) throw new AggregateError(errors, 'Module load and rollback failed');
      throw loadError;
    } finally {
      transitioning = false;
    }
  }

  async function unload(id) {
    assertIdle();
    if (!definitions.has(id)) throw new Error('Unregistered module: ' + id);
    if (!active.has(id)) return;
    const dependent = dependentOf(id);
    if (dependent) throw new Error('Module is required by ' + dependent + ': ' + id);
    transitioning = true;
    try {
      await stop(id);
    } finally {
      transitioning = false;
    }
  }

  return Object.freeze({
    register,
    load,
    unload,
    isLoaded: id => active.has(id)
  });
}
