const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const baseURL = process.env.CF_TEST_URL;
if (!baseURL) throw new Error('Set CF_TEST_URL to the locally served staged Chemistry Framework URL.');

(async () => {
  const launchOptions = { headless: true };
  if (process.env.CF_CHROMIUM) launchOptions.executablePath = process.env.CF_CHROMIUM;
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      if (sessionStorage.getItem('chemistry-integration-seeded')) return;
      sessionStorage.setItem('chemistry-integration-seeded', '1');
      localStorage.setItem('chemistry-framework-inquiries', JSON.stringify([{
        id: 'inq.synthetic.integration',
        title: 'Synthetic stored inquiry',
        user_intuition: 'Synthetic stored inquiry',
        context: { system: '' }
      }]));
    });
    const moduleRequests = [];
    page.on('request', request => {
      if (request.url().includes('/src/framework-engine/adapters/chemistry.js')) moduleRequests.push(request.url());
    });
    await page.goto(new URL('#inquire', baseURL).href);
    await page.locator('#analyze').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#saved-count')?.textContent === '(1)');
    assert.equal(await page.evaluate(() => localStorage.getItem('chemistry-framework-inquiries') !== null), true);
    assert.ok(moduleRequests.length, 'the Framework Engine chemistry adapter module should load');
    assert.match(await page.locator('#saved-inquiries').innerText(), /Synthetic stored inquiry/);

    await page.locator('.saved-item').click();
    assert.equal(await page.locator('.inquiry-original').textContent(), 'Synthetic stored inquiry');
    await page.locator('#literature-query').fill('quantum yield integration fixture');
    await page.locator('#save-inquiry').click();
    await page.getByText('已保存在此浏览器。', {exact: true}).waitFor();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('chemistry-framework-inquiries')));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, 'inq.synthetic.integration');
    assert.equal(saved[0].literature.query, 'quantum yield integration fixture');

    await page.reload();
    await page.locator('.saved-item').click();
    assert.equal(await page.locator('#literature-query').inputValue(), 'quantum yield integration fixture');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    });
    await page.locator('#save-inquiry').click();
    await page.getByText('未能保存。请检查浏览器存储设置后重试。').waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('chemistry-framework-inquiries'))), saved);
    console.log('CF integration passed: FE adapter load, legacy read, update, reload, write failure.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
