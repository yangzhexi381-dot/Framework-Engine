export const storyData = {
  title: '灯塔值守',
  start: 'arrival',
  nodes: {
    arrival: {
      text: '暴风雨切断了海岸电力。林澈在灯塔控制室发现备用电池只够维持一项系统。',
      choices: [
        { label: '修复主灯', next: 'light', effects: { trust: 1, lightOn: true } },
        { label: '启动无线电求援', next: 'radio', effects: { signalSent: true } }
      ]
    },
    light: {
      text: '主灯重新亮起，远处船只改变航向。值守记录里还留着一条未发出的求援讯息。',
      choices: [
        { label: '继续守灯', next: 'ending_rescue', when: { lightOn: true } },
        { label: '查看无线电', next: 'ending_alone' }
      ]
    },
    radio: {
      text: '无线电发出求救信号，但备用电源不足以同时点亮主灯。',
      choices: [
        { label: '等待救援', next: 'ending_rescue', when: { signalSent: true } },
        { label: '冒险点亮主灯', next: 'ending_alone' }
      ]
    },
    ending_rescue: {
      text: '天亮前，救援船抵达海湾。灯塔记录将这次选择记作“守望成功”。',
      ending: '救援抵达'
    },
    ending_alone: {
      text: '风暴逐渐减弱，林澈独自修复系统。海面平静下来，但错过了最佳联络窗口。',
      ending: '独自守夜'
    }
  }
};

export function canChoose(choice, state) {
  return Object.entries(choice.when ?? {}).every(([key, value]) => state[key] === value);
}

export const storyPlugin = {
  manifest: {
    id: 'story',
    name: '灯塔值守',
    description: '做出选择，查看故事如何根据已有状态开放行动和结局。'
  },
  initialState: () => ({
    nodeId: storyData.start, trust: 0, lightOn: false, signalSent: false, history: []
  }),
  validateState(state) {
    return Boolean(state && Object.hasOwn(storyData.nodes, state.nodeId) && Number.isFinite(state.trust) &&
      typeof state.lightOn === 'boolean' && typeof state.signalSent === 'boolean' &&
      Array.isArray(state.history)) || '剧情存档格式无效。';
  },
  reduce(state, action) {
    if (action?.type !== 'choose') throw new Error('Unknown story action');
    const choice = Number.isInteger(action.index)
      ? storyData.nodes[state.nodeId].choices?.[action.index]
      : undefined;
    if (!choice) throw new Error('该行动不可用。');
    if (!canChoose(choice, state)) throw new Error('当前状态尚未满足行动条件。');
    return {
      ...state,
      ...choice.effects,
      nodeId: choice.next,
      history: [...state.history, { from: state.nodeId, choice: choice.label, to: choice.next }]
    };
  }
};
