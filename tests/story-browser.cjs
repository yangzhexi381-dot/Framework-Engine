const assert = require('node:assert/strict');
const {chromium} = require('playwright');

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CF_CHROMIUM,
    headless: true
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.FE_TEST_URL || 'http://127.0.0.1:8080/');
    await page.waitForFunction(() => !document.querySelector('#advance').disabled);
    assert.match(await page.locator('#scene').innerText(), /应急灯/);
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({width, height: 850});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.locator('#advance').click();
    assert.match(await page.locator('#scene').innerText(), /巡查/);
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#scene').textContent.includes('巡查'));
    await page.locator('#advance').click();
    assert.match(await page.locator('#scene').innerText(), /安静下来/);
    assert.ok(await page.locator('#advance').isDisabled());
    await page.locator('#reset').click();
    assert.match(await page.locator('#scene').innerText(), /应急灯/);
    assert.deepEqual(errors, []);
    console.log('FE demo passed: responsive layout, advance, persisted reload, reset.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
