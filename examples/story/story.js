const saveKey = 'framework-engine:story-example:scene';

export const scenes = Object.freeze([
  '整栋楼停电了。楼梯口的应急灯还亮着，门后传来三声敲击。',
  '你推开防火门。值班员递来一张纸条，上面记着停电前最后一次配电室巡查。',
  '循着巡查记录，你找到了掉闸的分区。值班员打开桌上的台灯，楼梯口安静下来。'
]);

export const storyAdapter = {
  connect({state, events}) {
    return Object.freeze({
      state,
      advance: () => events.emit('story:advance'),
      reset: () => events.emit('story:reset')
    });
  }
};

export const storyModules = [
  {
    id: 'story.progress',
    start({data, state}) {
      let saved = 0;
      try {
        saved = data.read(saveKey, 0);
      } catch {
        // Storage can be unavailable or contain a damaged save.
      }
      const scene = Number.isInteger(saved) && scenes[saved] !== undefined ? saved : 0;
      state.update(() => ({scene}));
      return state.subscribe(current => data.write(saveKey, current.scene));
    }
  },
  {
    id: 'story.navigation',
    requires: ['story.progress'],
    start({events, state}) {
      function go(scene) {
        const {errors} = state.update(() => ({scene}));
        if (errors.length) throw new Error('Unable to save story progress');
      }

      const offAdvance = events.on('story:advance', () => {
        go(Math.min(state.get().scene + 1, scenes.length - 1));
      });
      const offReset = events.on('story:reset', () => go(0));
      return () => {
        offAdvance();
        offReset();
      };
    }
  }
];
