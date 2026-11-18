import {createEngine} from '../../src/index.js';
import {bindText} from '../../src/ui/bind-text.js';
import {scenes, storyAdapter, storyModules} from './story.js';

const engine = createEngine({
  initialState: {scene: 0},
  storage: {
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value)
  }
});
storyModules.forEach(module => engine.modules.register(module));
await engine.modules.load('story.navigation');

const story = engine.connect(storyAdapter);
const advance = document.querySelector('#advance');
const reset = document.querySelector('#reset');
const status = document.querySelector('#status');

bindText(document.querySelector('#scene'), story.state, snapshot => scenes[snapshot.scene]);

function renderControls({scene}) {
  advance.disabled = scene === scenes.length - 1;
  reset.disabled = scene === 0;
}
renderControls(story.state.get());
story.state.subscribe(renderControls);

function interact(action) {
  status.textContent = action().length ? '浏览器未能保存进度。' : '';
}
advance.addEventListener('click', () => interact(story.advance));
reset.addEventListener('click', () => interact(story.reset));
