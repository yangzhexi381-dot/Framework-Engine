import { FrameworkEngine } from '../src/index.js';
import { chemistryPlugin } from '../src/adapters/chemistry/demo-app.js';
import { storyPlugin, storyData, canChoose } from '../src/adapters/story/story.js';
import { cellPotential } from '../src/models/daniell-cell.js';
import { escapeHtml as escape } from '../src/ui/escape-html.js';

const engine = new FrameworkEngine();
engine.register(chemistryPlugin);
engine.register(storyPlugin);

const root = document.querySelector('#app');

function chemistryView(state) {
  const { E, Q } = cellPotential(state);
  return `
    <section class="grid">
      <article class="card">
        <h2>Zn / Zn²⁺ ‖ Cu²⁺ / Cu</h2>
        <div class="cell">
          <div><b>负极 · 氧化</b><p>Zn(s) → Zn²⁺(aq) + 2e⁻</p></div>
          <div class="arrow">e⁻ →</div>
          <div><b>正极 · 还原</b><p>Cu²⁺(aq) + 2e⁻ → Cu(s)</p></div>
        </div>
        <p class="muted">总反应为 Zn + Cu²⁺ → Zn²⁺ + Cu。盐桥维持电中性。</p>
      </article>
      <article class="card result" aria-live="polite">
        <h2>计算电势</h2>
        <div class="voltage">${E.toFixed(4)} <small>V</small></div>
        <div>反应商 Q = ${Q.toPrecision(4)}</div>
      </article>
    </section>
    <section class="card">
      <h2>参数</h2>
      <form id="chem-form" class="params">
        <label>温度 T（K）<input name="temperatureK" type="number" min="273.15" max="373.15" step="any" required value="${state.temperatureK}"></label>
        <label>Zn²⁺ 活度<input name="aZn2" type="number" min="0.01" max="10" step="any" required value="${state.aZn2}"></label>
        <label>Cu²⁺ 活度<input name="aCu2" type="number" min="0.01" max="10" step="any" required value="${state.aCu2}"></label>
        <button type="submit">更新电势</button>
      </form>
      <p class="note">E = E° − (RT/2F) ln Q，Q = a(Zn²⁺)/a(Cu²⁺)。教学计算取 E° = 1.100 V，只在 RT/2F 项中改变温度。活度无量纲。模型忽略极化、内阻和液接电势。</p>
    </section>`;
}

function storyView(state) {
  const node = storyData.nodes[state.nodeId];
  const actions = node.choices
    ? node.choices.map((choice, index) => canChoose(choice, state)
      ? `<button type="button" data-choice="${index}">${escape(choice.label)}</button>` : '').join('')
    : `<p class="ending">结局 · ${escape(node.ending)}</p>`;
  return `
    <section class="card story">
      <p class="narrative">${escape(node.text)}</p>
      <div class="state">主灯 ${state.lightOn ? '已亮' : '未亮'} · 状态记录 ${state.history.length} 步</div>
      <div class="choices">${actions}</div>
    </section>`;
}

function render() {
  const apps = engine.list();
  const active = apps.find(app => app.id === engine.activeId);
  root.innerHTML = `
    <header>
      <strong>Framework Engine</strong>
      <label>示例 <select id="framework">${apps.map(app =>
        `<option value="${escape(app.id)}" ${app === active ? 'selected' : ''}>${escape(app.name)}</option>`
      ).join('')}</select></label>
    </header>
    <main>
      <section class="intro">
        <h1>${escape(active.name)}</h1>
        <p>${escape(active.description)}</p>
      </section>
      <div id="demo-error" class="error" role="alert" hidden></div>
      ${active.id === 'chemistry' ? chemistryView(engine.state) : storyView(engine.state)}
      <section class="toolbar">
        <button type="button" id="reset">重置示例</button>
        <button type="button" id="export">导出 JSON</button>
        <label class="import">导入 JSON <input id="import" type="file" accept="application/json,.json"></label>
      </section>
    </main>`;
}

function showError(error) {
  const target = root.querySelector('#demo-error');
  target.hidden = false;
  target.textContent = error.message;
}

function perform(action) {
  try { action(); } catch (error) { showError(error); }
}

root.addEventListener('submit', event => {
  if (event.target.id !== 'chem-form') return;
  event.preventDefault();
  const values = Object.fromEntries(
    [...new FormData(event.target)].map(([key, value]) => [key, Number(value)])
  );
  perform(() => engine.dispatch({ type: 'set-parameters', values }));
});

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'reset') perform(() => engine.reset());
  if (button.hasAttribute('data-choice')) {
    perform(() => engine.dispatch({ type: 'choose', index: Number(button.dataset.choice) }));
  }
  if (button.id === 'export') {
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([engine.exportData()], { type: 'application/json' }));
    link.href = url;
    link.download = `fe-${engine.activeId}-state.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});

root.addEventListener('change', async event => {
  if (event.target.id === 'framework') perform(() => engine.load(event.target.value));
  if (event.target.id !== 'import' || !event.target.files[0]) return;
  const target = event.target;
  try {
    const data = await target.files[0].text();
    if (target.isConnected) engine.importData(data);
  } catch (error) {
    if (target.isConnected) {
      target.value = '';
      showError(error);
    }
  }
});

engine.events.subscribe('framework:loaded', render);
engine.events.subscribe('state:changed', render);
engine.load('chemistry');
