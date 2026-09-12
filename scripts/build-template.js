import { readFile, writeFile } from 'node:fs/promises';

const nativeTypes = JSON.parse(await readFile('template/consent-types.json', 'utf8'));
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
const nativeOnly = [{paramName: 'consentMode', paramValue: 'native', type: 'EQUALS'}];
const explicitOnly = [{paramName: 'consentMode', paramValue: 'explicit', type: 'EQUALS'}];
const consentItems = nativeTypes.map((value) => ({value, displayValue: value}));
const parameters = [
  {type: 'SELECT', name: 'consentMode', displayName: 'Consent input', defaultValue: 'native',
    selectItems: [{value: 'native', displayValue: 'GTM Consent Mode'},
      {value: 'explicit', displayValue: 'Explicit CMP inputs'}]},
  {type: 'SIMPLE_TABLE', name: 'additionalConsentTypes', displayName: 'Additional tracking requirements',
    help: 'analytics_storage is always required in native mode. Every selected type must permit tracking.',
    enablingConditions: nativeOnly,
    simpleTableColumns: [{defaultValue: '', selectItems: consentItems.filter(item => item.value !== 'analytics_storage'),
      valueValidators: [{type: 'NON_EMPTY'}],
      type: 'SELECT', name: 'consentType', displayName: 'Consent type', isUnique: true}]},
  {type: 'SELECT', macrosInSelect: true, defaultValue: false,
    selectItems: [{value: false, displayValue: 'Denied'}], name: 'trackingGranted', displayName: 'Tracking permission',
    simpleValueType: true, enablingConditions: explicitOnly,
    help: 'Choose a GTM variable returning boolean true or false. Only boolean true permits tracking; strings and missing values deny it.'},
  {type: 'SELECT', name: 'activationConsentType', displayName: 'YouTube activation permission (reserved)',
    defaultValue: 'none', enablingConditions: nativeOnly,
    selectItems: [{value: 'none', displayValue: 'Not configured'}, ...consentItems],
    help: 'Choose the consent type your site uses for YouTube activation. This version records the separate policy but does not activate inert embeds.'},
  {type: 'SELECT', macrosInSelect: true, defaultValue: false,
    selectItems: [{value: false, displayValue: 'Denied'}], name: 'activationGranted', displayName: 'YouTube activation permission (reserved)',
    simpleValueType: true, enablingConditions: explicitOnly,
    help: 'Optional GTM boolean variable for YouTube activation. Independent of tracking permission; this version does not activate inert embeds.'},
];
const sections = {
  TERMS_OF_SERVICE: "By creating or modifying this file you agree to Google Tag Manager's Community\nTemplate Gallery Developer Terms of Service available at\nhttps://developers.google.com/tag-manager/gallery-tos (or such other URL as\nGoogle may provide), as modified from time to time.",
  INFO: JSON.stringify({ type: 'TAG', id: 'cvt_temp_public_id', version: 1,
    securityGroups: [], displayName: 'Consent-aware YouTube tracker (implementation slice)',
    categories: ['ANALYTICS'],
    description: 'Tracks play events from one existing API-enabled YouTube iframe using native consent requirements or explicit boolean CMP inputs. Set native defaults before execution.',
    containerContexts: ['WEB'] }, null, 2),
  TEMPLATE_PARAMETERS: JSON.stringify(parameters, null, 2),
  SANDBOXED_JS_FOR_WEB_TEMPLATE: (await readFile('template/sandbox.js', 'utf8')).replace('__COMPANION_URL__', url).replace('__NATIVE_CONSENT_TYPES__', JSON.stringify(nativeTypes)).trim(),
  WEB_PERMISSIONS: JSON.stringify([
    permission('access_consent', { consentTypes: list(nativeTypes.map((consentType) => map({ consentType, read: true, write: false }))) }),
    permission('inject_script', { urls: list([scalar(url)]) }),
    permission('access_globals', { keys: list([map({ key: 'consentAwareYouTube', read: false, write: false, execute: true })]) }),
    permission('access_template_storage'),
    permission('logging', {environments: scalar('debug')}),
  ], null, 2),
  TESTS: await readFile('template/tests.yaml', 'utf8'),
};
await writeFile('template.tpl', Object.entries(sections).map(([name, body]) => `___${name}___\n\n${body.trim()}\n`).join('\n'));
console.log(url);
