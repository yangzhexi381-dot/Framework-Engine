const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.FE_TEST_URL ?? 'http://127.0.0.1:8000/');
    await page.locator('.voltage').filter({ hasText: '1.1000' }).waitFor();
    const zinc = page.locator('input[name="aZn2"]');
    const update = page.getByRole('button', { name: '更新电势' });
    await zinc.fill('0');
    await update.click();
    assert.equal(await zinc.evaluate(input => input.validity.rangeUnderflow), true);
    await zinc.fill('10');
    await update.click();
    await page.locator('.voltage').filter({ hasText: '1.0704' }).waitFor();
    await page.reload();
    await page.locator('.voltage').filter({ hasText: '1.0704' }).waitFor();
    await page.selectOption('#framework', 'story');
    await page.getByRole('button', { name: '修复主灯' }).click();
    await page.getByRole('button', { name: '继续守灯' }).click();
    await page.getByText('结局 · 救援抵达').waitFor();
    const downloadReady = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 JSON' }).click();
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), 'fe-story-state.json');
    await page.getByRole('button', { name: '重置示例' }).click();
    await page.getByRole('button', { name: '修复主灯' }).waitFor();
    await page.locator('#import').setInputFiles(await download.path());
    await page.getByText('结局 · 救援抵达').waitFor();
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `overflow at ${width}px`);
    }
    assert.deepEqual(errors, []);
    console.log('Framework Engine browser acceptance passed at 390, 768, and 1280px');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
