const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const errors = [];
    const key = 'chemistry-framework-inquiries';
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(storageKey => {
      if (localStorage.getItem(storageKey) === null) {
        localStorage.setItem(storageKey, JSON.stringify([
          { id: 'inq.legacy', user_intuition: '铅酸蓄电池的端电压由哪些量决定？', context: { system: '' } }
        ]));
      }
    }, key);
    const base = process.env.CF_TEST_URL;
    const adapterLoaded = page.waitForResponse(response =>
      new URL(response.url()).pathname.endsWith('/src/fe/adapters/chemistry/inquiry-store.js') &&
      response.ok());
    await page.goto(base + '#inquire');
    await adapterLoaded;
    await page.locator('#saved-inquiries .saved-item').getByText('铅酸蓄电池的端电压由哪些量决定？').waitFor({ state: 'attached' });
    await page.locator('#intuition').fill('温度如何改变平衡常数？');
    await page.locator('#analyze').click();
    await page.locator('#save-inquiry').click();
    await page.getByText('已保存在此浏览器。', { exact: true }).waitFor();
    await page.reload();
    assert.equal(await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).length, key), 2);
    await page.locator('#saved-inquiries .saved-item').getByText('温度如何改变平衡常数？').waitFor({ state: 'attached' });
    await page.evaluate(storageKey => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (requestedKey, value) {
        if (requestedKey === storageKey) throw new DOMException('quota exceeded', 'QuotaExceededError');
        return original.call(this, requestedKey, value);
      };
    }, key);
    await page.locator('#intuition').fill('反应速率会随反应物浓度改变吗？');
    await page.locator('#analyze').click();
    await page.locator('#save-inquiry').click();
    await page.getByText(/未能保存/).waitFor();
    assert.equal(await page.locator('#saved-inquiries .saved-item').count(), 2);
    assert.deepEqual(errors, []);
    console.log('CF browser inquiry acceptance passed through the FE adapter');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
