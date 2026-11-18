const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');

const profiles = [
  ['Android phone', { ...devices['Pixel 7'], viewport: { width: 390, height: 850 } }],
  ['touch tablet', { viewport: { width: 768, height: 960 }, hasTouch: true, isMobile: true }],
  ['desktop', { viewport: { width: 1280, height: 900 } }]
];

async function verify(browser, target, [name, options]) {
  const context = await browser.newContext(options);
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const activate = locator => options.hasTouch ? locator.tap() : locator.click();
    const openCatalog = async () => {
      const response = await page.goto(target);
      assert.ok(response.ok(), `catalog returned HTTP ${response.status()}`);
      await page.getByRole('heading', { level: 1, name: '试玩', exact: true }).waitFor();
      assert.ok(await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    };

    await openCatalog();
    const storyLink = page.locator('a[href="./playground/story.html"]');
    await activate(storyLink);
    await activate(page.locator('#newBtn'));
    await page.locator('#dialogueBox').waitFor();
    const readSave = () => page.evaluate(() => localStorage.getItem('unconditional_traitor_illustrated_autosave_v1'));
    const savedGame = await readSave();
    assert.ok(savedGame, 'the real story writes an autosave');
    await page.reload();
    const restored = JSON.parse(await readSave());
    const original = JSON.parse(savedGame);
    assert.equal(restored.version, original.version);
    assert.equal(restored.run.node, original.run.node);
    assert.deepEqual(restored.run.history, original.run.history);
    assert.equal(await page.locator('#designRevealBtn').isVisible(), false);

    await openCatalog();
    await activate(page.locator('a[href="./playground/structure.html"]'));
    await activate(page.locator('button[data-goto="1"]'));
    await page.locator('#nBox').fill('5');
    assert.equal(await page.locator('#boxNodes').textContent(), '4');
    assert.equal(await page.locator('#boxEnergy').textContent(), '25 E₁');
    assert.deepEqual(errors, []);
    console.log(`${name} passed: catalog, Story save and structural chemistry (${options.viewport.width}px)`);
  } finally {
    await context.close();
  }
}

async function main() {
  const target = process.env.FE_PLAYGROUND_URL ?? 'http://127.0.0.1:8000/';
  const browser = await chromium.launch({ executablePath: process.env.FE_CHROMIUM });
  try {
    for (const profile of profiles) await verify(browser, target, profile);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
