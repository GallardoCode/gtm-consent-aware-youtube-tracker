import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const apiSource = await readFile(new URL('./fixtures/youtube-api.js', import.meta.url), 'utf8');

for (const wrapBridgeMessages of [false, true]) {
  test(`the demo shows regrant and later plays with ${wrapBridgeMessages ? 'wrapped' : 'plain'} bridge messages`, async ({ page }) => {
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

    await page.evaluate(wrapBridgeMessages => {
      if (!wrapBridgeMessages) return;
      // GTM wraps synchronous pushes made while a sandbox bridge call is active.
      class TemplateMessage {
        constructor(value) { this.value = value; }
        getUntrustedMessageValue() { return this.value; }
      }
      const bridge = window.consentAwareYouTube;
      window.consentAwareYouTube = granted => {
        const layer = window.dataLayer;
        const push = layer.push;
        layer.push = function (...messages) {
          return push.apply(this, messages.map(message => new TemplateMessage(message)));
        };
        try { return bridge(granted); }
        finally { layer.push = push; }
      };
    }, wrapBridgeMessages);
    await page.getByRole('button', { name: 'Withdraw analytics', exact: true }).click();
    await page.evaluate(() => {
      window.playerFixture.players[0].pause();
      window.playerFixture.players[0].play(70);
    });
    await page.getByRole('button', { name: 'Grant analytics', exact: true }).click();
    await expect.poll(async () => JSON.parse(await page.locator('#events').textContent())
      .map(event => event.video_current_time)).toEqual([70, 20]);
    await expect(page.locator('#event-count')).toHaveText('2 events. Newest first.');
    expect(await page.evaluate(() => window.dataLayer.map(message =>
      typeof message?.getUntrustedMessageValue === 'function' ? message.getUntrustedMessageValue() : message)
      .filter(event => event?.event === 'custom_video')
      .map(event => event.video_current_time))).toEqual([20, 70]);
    expect(await page.evaluate(() => window.dataLayer.filter(message =>
      typeof message?.getUntrustedMessageValue === 'function').length)).toBe(wrapBridgeMessages ? 1 : 0);

    await page.evaluate(() => {
      window.playerFixture.players[0].pause();
      window.playerFixture.players[0].play(80);
    });
    await expect.poll(async () => JSON.parse(await page.locator('#events').textContent())
      .map(event => event.video_current_time)).toEqual([80, 70, 20]);
    await expect(page.locator('#event-count')).toHaveText('3 events. Newest first.');
  });
}

test('explicit demo publishes initial values and every grant or withdrawal with its update event', async ({ page }) => {
  await page.route('https://**/*', route => route.fulfill({
    body: new URL(route.request().url()).pathname === '/iframe_api' ? apiSource : '',
    contentType: new URL(route.request().url()).pathname === '/iframe_api' ? 'text/javascript' : 'text/html',
  }));
  await page.goto('/?mode=explicit');
  await expect.poll(() => page.evaluate(() => window.dataLayer.filter(item => item.event === 'tracker_demo_consent')
    .map(item => item.tracker_analytics))).toEqual([false]);
  await page.getByRole('button', {name: 'Grant analytics', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.playerFixture?.players[0]?.listeners.size)).toBe(1);
  await page.evaluate(() => window.playerFixture.players[0].play(20));
  await page.getByRole('button', {name: 'Execute template again'}).click();
  await page.getByRole('button', {name: 'Withdraw analytics', exact: true}).click();
  await page.evaluate(() => {
    window.playerFixture.players[0].pause();
    window.playerFixture.players[0].play(70);
  });
  await expect(page.locator('#event-count')).toHaveText('1 event. Newest first.');
  await page.getByRole('button', {name: 'Grant analytics', exact: true}).click();
  await expect.poll(async () => JSON.parse(await page.locator('#events').textContent())
    .map(event => event.video_current_time)).toEqual([70, 20]);
  expect(await page.evaluate(() => window.dataLayer.filter(item => item.event === 'tracker_demo_consent')
    .map(item => item.tracker_analytics))).toEqual([false, true, false, true]);
});
