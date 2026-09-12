import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const apiSource = await readFile(new URL('./fixtures/youtube-api.js', import.meta.url), 'utf8');

async function fixture(page, query = '') {
  const attempted = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) attempted.push(request.url());
  });
  await page.route('https://**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'cdn.jsdelivr.net') {
      await route.fulfill({ path: 'companion/youtube-tracker.js', contentType: 'text/javascript' });
    } else if (url.pathname === '/iframe_api') {
      await route.fulfill({ body: apiSource, contentType: 'text/javascript' });
    } else if (url.pathname.startsWith('/embed/')) {
      await route.fulfill({ body: '<img src="https://i.ytimg.com/fixture-baseline.jpg">', contentType: 'text/html' });
    } else {
      await route.fulfill({ body: '', contentType: 'image/jpeg' });
    }
  });
  await page.goto('/fixture' + query);
  return attempted;
}

const events = (page) => page.evaluate(() => window.dataLayer);
const run = (page) => page.evaluate(() => window.fixture.runTemplate());
const consent = (page, value) => page.evaluate((value) => window.fixture.setConsent(value), value);
const ready = (page) => expect.poll(() => page.evaluate(() =>
  window.playerFixture?.players[0]?.listeners.size)).toBe(1);

test('denial preserves the existing iframe baseline; grant emits a prototype-compatible play', async ({ page, context }) => {
  const attempted = await fixture(page);
  const baseline = [...attempted];
  const cookies = await context.cookies();
  const markup = await page.locator('iframe').evaluate((iframe) => iframe.outerHTML);
  expect(baseline).toHaveLength(2);
  expect(baseline.some((url) => url.includes('/embed/'))).toBe(true);
  await run(page);
  await page.waitForTimeout(150);
  expect(attempted).toEqual(baseline);
  expect(await context.cookies()).toEqual(cookies);
  expect(await events(page)).toEqual([]);
  expect(await page.evaluate(() => window.playerFixture)).toBeUndefined();

  await consent(page, true);
  await ready(page);
  await page.evaluate(() => window.playerFixture.players[0].play());
  expect(await events(page)).toEqual([{
    event: 'custom_video', video_status: 'play', video_title: 'YouTube Video',
    video_url: 'https://www.youtube.com/embed/M7lc1UVf-VE', video_percent: 12,
    video_duration: 100, video_current_time: 12, video_provider: 'youtube', visible: true,
  }]);
  expect(attempted.filter((url) => url.includes('cdn.jsdelivr.net'))).toHaveLength(1);
  expect(attempted.filter((url) => url.endsWith('/iframe_api'))).toHaveLength(1);
  expect(await page.locator('iframe').evaluate((iframe) => iframe.outerHTML)).toBe(markup);
  expect(await context.cookies()).toEqual(cookies);
});

test('withdrawal stops observation; regrant reports only the current position and reuses initialization', async ({ page }) => {
  const attempted = await fixture(page);
  await consent(page, true);
  await run(page);
  await ready(page);
  await run(page);
  await run(page);
  await page.evaluate(() => {
    const player = window.playerFixture.players[0];
    window.staleStateCallback = [...player.listeners.values()][0];
    player.play(20);
    player.play(20);
  });
  expect(await events(page)).toHaveLength(1);
  await consent(page, false);
  expect(await page.evaluate(() => window.playerFixture.players[0].listeners.size)).toBe(1);
  const afterWithdrawal = [...attempted];
  await page.evaluate(() => {
    const player = window.playerFixture.players[0];
    player.pause();
    player.play(70);
    window.staleStateCallback({ target: player, data: 1 });
  });
  expect(await events(page)).toHaveLength(1);
  await consent(page, true);
  await ready(page);
  expect((await events(page)).map((event) => event.video_current_time)).toEqual([20, 70]);
  await page.evaluate(() => {
    const player = window.playerFixture.players[0];
    player.pause();
    window.staleStateCallback({ target: player, data: 1 });
  });
  expect(await events(page)).toHaveLength(2);
  await page.evaluate(() => window.playerFixture.players[0].play(80));
  expect((await events(page)).map((event) => event.video_current_time)).toEqual([20, 70, 80]);
  expect(attempted).toEqual(afterWithdrawal);
  expect(await page.evaluate(() => window.playerFixture.players.length)).toBe(1);
  expect(await page.evaluate(() => window.fixture.consentListenerCount())).toBe(1);
});

test('withdrawal during companion download prevents API loading until a new grant', async ({ page }) => {
  const attempted = await fixture(page);
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route('https://cdn.jsdelivr.net/**', async (route) => {
    await held;
    await route.fulfill({ path: 'companion/youtube-tracker.js', contentType: 'text/javascript' });
  });
  await run(page);
  await consent(page, true);
  await expect.poll(() => attempted.filter((url) => url.includes('cdn.jsdelivr.net')).length).toBe(1);
  await run(page);
  await consent(page, false);
  release();
  await page.waitForFunction(() => typeof window.consentAwareYouTube === 'function');
  await page.waitForTimeout(150);
  expect(attempted.filter((url) => url.endsWith('/iframe_api'))).toHaveLength(0);
  expect(await events(page)).toEqual([]);
  await consent(page, true);
  await ready(page);
  expect(attempted.filter((url) => url.includes('cdn.jsdelivr.net'))).toHaveLength(1);
});

test('API script download is distinct from readiness and withdrawal prevents player construction', async ({ page }) => {
  await page.addInitScript(() => {
    window.deferApiReady = true;
    window.otherReadyCalls = 0;
    window.onYouTubeIframeAPIReady = () => window.otherReadyCalls++;
    window.originalApiReady = window.onYouTubeIframeAPIReady;
  });
  const attempted = await fixture(page);
  await consent(page, true);
  await run(page);
  await page.waitForFunction(() => window.playerFixture);
  expect(await page.evaluate(() => window.playerFixture.players.length)).toBe(0);
  await consent(page, false);
  await page.evaluate(() => window.playerFixture.install());
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.playerFixture.players.length)).toBe(0);
  expect(await page.evaluate(() => window.otherReadyCalls)).toBe(1);
  expect(await page.evaluate(() => window.onYouTubeIframeAPIReady === window.originalApiReady)).toBe(true);
  await consent(page, true);
  await ready(page);
  expect(attempted.filter((url) => url.endsWith('/iframe_api'))).toHaveLength(1);
});

test('withdrawal during player loading prevents observation from a late ready callback', async ({ page }) => {
  await page.addInitScript(() => { window.deferApiReady = true; });
  await fixture(page);
  await run(page);
  await consent(page, true);
  await page.waitForFunction(() => window.playerFixture);
  await page.evaluate(() => {
    window.playerFixture.autoReady = false;
    window.playerFixture.state = 1;
    window.playerFixture.install();
  });
  await expect.poll(() => page.evaluate(() => window.playerFixture.players.length)).toBe(1);
  await consent(page, false);
  await page.evaluate(() => window.playerFixture.players[0].ready());
  expect(await page.evaluate(() => window.playerFixture.players[0].listeners.size)).toBe(0);
  expect(await events(page)).toEqual([]);
  await page.evaluate(() => { window.playerFixture.time = 65; });
  await consent(page, true);
  await ready(page);
  expect((await events(page)).map((event) => event.video_current_time)).toEqual([65]);
});

for (const initial of [true, undefined]) {
  test(`saved or unset consent (${initial}) observes current playback using an existing API`, async ({ page }) => {
    const attempted = await fixture(page, '?host=youtube-nocookie.com');
    await page.addScriptTag({ content: apiSource });
    await page.evaluate(() => { window.playerFixture.state = 1; window.playerFixture.time = 45; });
    await consent(page, initial);
    await run(page);
    await ready(page);
    expect((await events(page)).map((event) => [event.video_status, event.video_current_time, event.video_url])).toEqual([
      ['play', 45, 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE'],
    ]);
    expect(attempted.filter((url) => url.endsWith('/iframe_api'))).toHaveLength(0);
  });
}

for (const query of ['?api=0', '?origin=https://wrong.example', '?exclude=1']) {
  test(`unsupported or excluded live embed is left unchanged (${query})`, async ({ page }) => {
    const attempted = await fixture(page, query);
    const markup = await page.locator('iframe').evaluate((iframe) => iframe.outerHTML);
    const baseline = [...attempted];
    await consent(page, true);
    await run(page);
    await page.waitForFunction(() => window.consentAwareYouTube);
    await page.waitForTimeout(150);
    expect(attempted.filter((url) => !url.includes('cdn.jsdelivr.net'))).toEqual(baseline);
    expect(await page.locator('iframe').evaluate((iframe) => iframe.outerHTML)).toBe(markup);
    expect(await events(page)).toEqual([]);
  });
}

for (const mode of ['absent', 'throw', 'invalid', 'valid']) {
  test(`optional title metadata (${mode}) does not interrupt play reporting`, async ({ page }) => {
    await fixture(page, '?title=Site%20title');
    await page.addScriptTag({ content: apiSource });
    await page.evaluate((mode) => {
      window.playerFixture.titleMode = mode;
      if (mode === 'absent') delete window.YT.Player.prototype.getVideoData;
      if (mode === 'invalid') window.YT.Player.prototype.getVideoData = () => ({ title: 42 });
    }, mode);
    await consent(page, true);
    await run(page);
    await ready(page);
    await page.evaluate(() => window.playerFixture.players[0].play());
    expect((await events(page))[0].video_title).toBe(mode === 'valid' ? 'YouTube title' : 'Site title');
  });
}

test('a shared loading API script is reused', async ({ page }) => {
  await page.addInitScript(() => { window.deferApiReady = true; });
  const attempted = await fixture(page);
  await page.addScriptTag({ url: 'https://www.youtube.com/iframe_api' });
  await consent(page, true);
  await run(page);
  await page.waitForFunction(() => window.consentAwareYouTube);
  await page.evaluate(() => window.playerFixture.install());
  await ready(page);
  expect(attempted.filter((url) => url.endsWith('/iframe_api'))).toHaveLength(1);
});
