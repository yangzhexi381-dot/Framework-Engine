import { cellPotential } from '../../models/daniell-cell.js';

export const chemistryPlugin = {
  manifest: {
    id: 'chemistry',
    name: 'Daniell 电池',
    description: '调整温度和两种离子的活度，观察 Nernst 模型的计算结果。'
  },
  initialState: () => ({ temperatureK: 298.15, aZn2: 1, aCu2: 1 }),
  validateState(state) {
    if (!state || !['temperatureK', 'aZn2', 'aCu2'].every(key => Object.hasOwn(state, key))) {
      return '存档缺少温度或活度。';
    }
    try {
      cellPotential(state);
      return true;
    } catch (error) {
      return error.message;
    }
  },
  reduce(state, action) {
    if (action?.type !== 'set-parameters') throw new Error('Unknown chemistry action');
    return { ...state, ...action.values };
  }
};
