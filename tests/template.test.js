import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const template = await readFile('template.tpl', 'utf8');
const section = (name) => template.split(`___${name}___`)[1].split(/___[A-Z_]+___/)[0].trim();
const code = section('SANDBOXED_JS_FOR_WEB_TEMPLATE');
const scenarios = parse(section('TESTS')).scenarios;

// Run the exported tests with modelled GTM APIs; this is not Google's sandbox.
for (const scenario of scenarios) {
  test(scenario.name, () => {
    const storage = new Map();
    const mocks = new Map();
    const calls = new Map();
    const record = (name, args) => {
      if (!calls.has(name)) calls.set(name, []);
      calls.get(name).push(args);
    };
    const defaults = {
      templateStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      addConsentListener() {}, injectScript() {}, callInWindow() {},
    };
    const requireApi = (name) => {
      if (!mocks.has(name) && !(name in defaults)) throw new Error('Unmodelled API: ' + name);
      const implementation = mocks.has(name) ? mocks.get(name) : defaults[name];
      if (name === 'templateStorage') return implementation;
      return (...args) => {
        record(name, args);
        return typeof implementation === 'function' ? implementation(...args) : implementation;
      };
    };
    const runCode = (data) => new Function('require', 'data', code)(requireApi, {
      ...data,
      gtmOnSuccess: () => record('gtmOnSuccess', []),
      gtmOnFailure: () => record('gtmOnFailure', []),
    });
    const assertApi = (name) => ({
      wasCalled: () => assert.ok(calls.get(name)?.length, name),
      wasNotCalled: () => assert.equal(calls.get(name)?.length || 0, 0, name),
      wasCalledWith: (...args) => assert.ok(calls.get(name)?.some((call) => {
        try { assert.deepEqual(call, args); return true; } catch { return false; }
      }), name),
    });
    const assertThat = (value) => ({
      isEqualTo: (expected) => assert.deepEqual(value, expected),
      isTrue: () => assert.equal(value, true),
      isFalse: () => assert.equal(value, false),
    });
    new Function('mock', 'runCode', 'assertApi', 'assertThat', scenario.code)(
      (name, value) => mocks.set(name, value), runCode, assertApi, assertThat);
  });
}

test('export uses the source bridge and one exact pinned URL with minimal permissions', async () => {
  const url = code.match(/https:\/\/cdn\.jsdelivr\.net\/gh\/GallardoCode\/gtm-consent-aware-youtube-tracker@[a-f0-9]{40}\/companion\/youtube-tracker\.js/)?.[0];
  assert.ok(url);
  assert.equal(code, (await readFile('template/sandbox.js', 'utf8')).replace('__COMPANION_URL__', url).trim());
  assert.equal(section('TESTS'), (await readFile('template/tests.yaml', 'utf8')).trim());
  const permissions = JSON.parse(section('WEB_PERMISSIONS'));
  const decode = (value) => value.type === 1 ? value.string : value.type === 8 ? value.boolean :
    value.type === 2 ? value.listItem.map(decode) :
      Object.fromEntries(value.mapKey.map((key, index) => [decode(key), decode(value.mapValue[index])]));
  const actual = Object.fromEntries(permissions.map(({ instance }) => [instance.key.publicId,
    Object.fromEntries(instance.param.map(({ key, value }) => [key, decode(value)]))]));
  assert.deepEqual(actual, {
    access_consent: { consentTypes: [{ consentType: 'analytics_storage', read: true, write: false }] },
    inject_script: { urls: [url] },
    access_globals: { keys: [{ key: 'consentAwareYouTube', read: false, write: false, execute: true }] },
    access_template_storage: {},
  });
});
