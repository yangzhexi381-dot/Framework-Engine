const assert = require('node:assert/strict');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function main() {
  const { writePilot } = await import('../integrations/story/build-pilot.mjs');
  const directory = await mkdtemp(join(tmpdir(), 'fe-story-offline-'));
  let browser;
  try {
    const html = join(directory, 'pilot.html');
    await writePilot(join(__dirname, 'fixtures/story-pilot.html'), html);
    browser = await chromium.launch({ executablePath: process.env.STORY_CHROMIUM });
    const page = await browser.newPage({ offline: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(html).href);
    await page.waitForFunction(() => document.querySelector('#progress').textContent === '0');
    assert.equal(await page.locator('#designRevealBtn').isVisible(), false);
    await page.locator('#advance').click();
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#progress').textContent === '1');
    await page.locator('#finish').click();
    await page.reload();
    await page.locator('#designRevealBtn').waitFor();
    await page.locator('#clear').click();
    assert.equal(await page.locator('#designRevealBtn').isVisible(), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('fe.synthetic.story')), null);
    assert.deepEqual(errors, []);
    console.log('FE Story offline fixture passed: save, reload, reveal and clear.');
  } finally {
    await browser?.close();
    await rm(directory, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
