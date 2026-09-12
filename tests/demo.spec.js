import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const apiSource = await readFile(new URL('./fixtures/youtube-api.js', import.meta.url), 'utf8');

test('the demo shows the newest play first after regrant without reordering the data layer', async ({ page }) => {
  await page.route('https://**/*', route => route.fulfill({
    body: new URL(route.request().url()).pathname === '/iframe_api' ? apiSource : '',
    contentType: new URL(route.request().url()).pathname === '/iframe_api' ? 'text/javascript' : 'text/html',
  }));
  await page.goto('/');
  await expect(page.locator('#events')).toHaveText('[]');
  await page.getByRole('button', { name: 'Grant analytics', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.playerFixture?.players[0]?.listeners.size)).toBe(1);
  await page.evaluate(() => window.playerFixture.players[0].play(20));
  await expect.poll(async () => JSON.parse(await page.locator('#events').textContent()).length).toBe(1);

  await page.getByRole('button', { name: 'Withdraw analytics', exact: true }).click();
  await page.evaluate(() => {
    window.playerFixture.players[0].pause();
    window.playerFixture.players[0].play(70);
  });
  await page.getByRole('button', { name: 'Grant analytics', exact: true }).click();
  await expect.poll(async () => JSON.parse(await page.locator('#events').textContent())
    .map(event => event.video_current_time)).toEqual([70, 20]);
  await expect(page.locator('#event-count')).toHaveText('2 events. Newest first.');
  expect(await page.evaluate(() => window.dataLayer.filter(event => event.event === 'custom_video')
    .map(event => event.video_current_time))).toEqual([20, 70]);
});
