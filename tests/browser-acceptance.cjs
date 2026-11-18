const assert = require('node:assert/strict');
const { createInterface } = require('node:readline');
const { chromium, devices } = require('playwright');

const profiles = [
  ['Android phone', { ...devices['Pixel 7'], viewport: { width: 390, height: 850 } }],
  ['touch tablet', { viewport: { width: 768, height: 960 }, hasTouch: true, isMobile: true }],
  ['desktop', { viewport: { width: 1280, height: 900 } }]
];

async function siteToken(target) {
  if (process.env.FE_SITE_AUTH_STDIN !== '1') return null;
  if (target.protocol !== 'https:') throw new Error('Site authorization requires HTTPS');
  const input = createInterface({ input: process.stdin, terminal: false });
  try {
    for await (const line of input) {
      if (line.trim()) return line.trim();
      break;
    }
  } finally {
    input.close();
  }
  throw new Error('Missing Site authorization');
}

async function verify(browser, target, token, profile) {
  const [name, options] = profile;
  const context = await browser.newContext(options);
  try {
    if (token) {
      await context.route(url => url.origin === target.origin, async route => {
        try {
          const response = await fetch(route.request().url(), {
            headers: { 'OAI-Sites-Authorization': 'Bearer ' + token },
            redirect: 'manual',
            signal: AbortSignal.timeout(15000)
          });
          const headers = Object.fromEntries(response.headers);
          delete headers['content-encoding'];
          delete headers['content-length'];
          await route.fulfill({
            status: response.status,
            headers,
            body: Buffer.from(await response.arrayBuffer())
          });
        } catch {
          // Do not forward network diagnostics that may contain credentials.
          await route.abort('failed');
        }
      });
    }

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(target.href);
    const voltage = page.locator('.voltage');
    await voltage.filter({ hasText: '1.1000' }).waitFor();
    assert.equal(new URL(page.url()).origin, target.origin);
    const activate = locator => options.hasTouch ? locator.tap() : locator.click();
    const zinc = page.locator('input[name="aZn2"]');
    const update = page.getByRole('button', { name: '更新电势' });
    await zinc.fill('0');
    await activate(update);
    assert.equal(await zinc.evaluate(input => input.validity.rangeUnderflow), true);
    await zinc.fill('10');
    await activate(update);
    await voltage.filter({ hasText: '1.0704' }).waitFor();
    await page.reload();
    await voltage.filter({ hasText: '1.0704' }).waitFor();

    await page.selectOption('#framework', 'story');
    await activate(page.getByRole('button', { name: '修复主灯' }));
    await activate(page.getByRole('button', { name: '继续守灯' }));
    const ending = page.getByText('结局 · 救援抵达');
    await ending.waitFor();
    const downloadReady = page.waitForEvent('download');
    await activate(page.getByRole('button', { name: '导出 JSON' }));
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), 'fe-story-state.json');
    await activate(page.getByRole('button', { name: '重置示例' }));
    await page.getByRole('button', { name: '修复主灯' }).waitFor();
    await page.locator('#import').setInputFiles(await download.path());
    await ending.waitFor();
    await page.reload();
    await page.selectOption('#framework', 'story');
    await ending.waitFor();

    assert.equal(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'viewport overflow');
    assert.deepEqual(errors, []);
    console.log(name + ' passed (' + options.viewport.width + 'px)');
  } finally {
    await context.close();
  }
}

async function main() {
  const target = new URL(process.env.FE_TEST_URL ?? 'http://127.0.0.1:8000/');
  const token = await siteToken(target);
  const browser = await chromium.launch({ executablePath: process.env.FE_CHROMIUM });
  try {
    for (const profile of profiles) await verify(browser, target, token, profile);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
