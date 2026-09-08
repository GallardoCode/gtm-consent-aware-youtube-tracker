import { readFile, writeFile } from 'node:fs/promises';

const sha = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('Pass the full companion commit SHA');
const url = `https://cdn.jsdelivr.net/gh/GallardoCode/gtm-consent-aware-youtube-tracker@${sha}/companion/youtube-tracker.js`;
const scalar = (value) => typeof value === 'boolean' ? { type: 8, boolean: value } : { type: 1, string: value };
const list = (values) => ({ type: 2, listItem: values });
const map = (value) => ({ type: 3, mapKey: Object.keys(value).map(scalar), mapValue: Object.values(value).map(scalar) });
const permission = (id, params = {}) => ({
  instance: { key: { publicId: id, versionId: '1' },
    param: Object.entries(params).map(([key, value]) => ({ key, value })) },
  clientAnnotations: { isEditedByUser: true }, isRequired: true,
});
const sections = {
  TERMS_OF_SERVICE: "By creating or modifying this file you agree to Google Tag Manager's Community\nTemplate Gallery Developer Terms of Service available at\nhttps://developers.google.com/tag-manager/gallery-tos (or such other URL as\nGoogle may provide), as modified from time to time.",
  INFO: JSON.stringify({ type: 'TAG', id: 'cvt_temp_public_id', version: 1,
    securityGroups: [], displayName: 'Consent-aware YouTube tracker (implementation slice)',
    categories: ['ANALYTICS'],
    description: 'Tracks play events from one existing API-enabled YouTube iframe after analytics_storage consent. Set consent defaults before this tag runs.',
    containerContexts: ['WEB'] }, null, 2),
  TEMPLATE_PARAMETERS: '[]',
  SANDBOXED_JS_FOR_WEB_TEMPLATE: (await readFile('template/sandbox.js', 'utf8')).replace('__COMPANION_URL__', url).trim(),
  WEB_PERMISSIONS: JSON.stringify([
    permission('access_consent', { consentTypes: list([map({ consentType: 'analytics_storage', read: true, write: false })]) }),
    permission('inject_script', { urls: list([scalar(url)]) }),
    permission('access_globals', { keys: list([map({ key: 'consentAwareYouTube', read: false, write: false, execute: true })]) }),
    permission('access_template_storage'),
  ], null, 2),
  TESTS: await readFile('template/tests.yaml', 'utf8'),
};
await writeFile('template.tpl', Object.entries(sections).map(([name, body]) => `___${name}___\n\n${body.trim()}\n`).join('\n'));
console.log(url);
