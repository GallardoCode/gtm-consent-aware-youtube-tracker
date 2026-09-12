const isConsentGranted = require('isConsentGranted');
const addConsentListener = require('addConsentListener');
const injectScript = require('injectScript');
const callInWindow = require('callInWindow');
const templateStorage = require('templateStorage');
const companionUrl = '__COMPANION_URL__';

const getType = require('getType');
const logToConsole = require('logToConsole');
const nativeTypes = __NATIVE_CONSENT_TYPES__;
const mode = data.consentMode === undefined ? 'native' : data.consentMode;
const additional = data.additionalConsentTypes === undefined ? [] : data.additionalConsentTypes;
const activationType = mode === 'explicit' ? 'none' :
  (data.activationConsentType === undefined ? 'none' : data.activationConsentType);

if ((mode !== 'native' && mode !== 'explicit') ||
    (mode === 'native' && (getType(additional) !== 'array' ||
      !additional.every(function(row) {
        return getType(row) === 'object' && nativeTypes.indexOf(row.consentType) !== -1;
      }) || (activationType !== 'none' && nativeTypes.indexOf(activationType) === -1)))) {
  logToConsole('YouTube tracker: invalid consent policy. Use the declared consent types.');
  data.gtmOnFailure();
  return;
}

const requirements = mode === 'explicit' ? [] : nativeTypes.filter(function(type) {
  return type === 'analytics_storage' || additional.some(function(row) { return row.consentType === type; });
});
const policyKey = mode + ':' + requirements.join(',') + ':' + activationType;
let state = templateStorage.getItem('tracker');
if (state && state.policyKey !== policyKey) {
  logToConsole('YouTube tracker: conflicting consent policy. Use one stable tag configuration per page.');
  data.gtmOnFailure();
  return;
}
if (!state) {
  state = { loading: false, loaded: false, policyKey: policyKey,
    mode: mode, requirements: requirements, activationType: activationType };
  templateStorage.setItem('tracker', state);
  if (mode === 'native') {
    const watched = requirements.slice();
    if (activationType !== 'none' && watched.indexOf(activationType) === -1) watched.push(activationType);
    watched.forEach(function(type) { addConsentListener(type, syncConsent); });
  }
}
state.trackingGranted = data.trackingGranted === true;
state.activationGranted = data.activationGranted === true;

function trackingAllowed() {
  if (state.mode === 'explicit') return state.trackingGranted;
  return state.requirements.every(function(type) { return isConsentGranted(type); });
}

function syncConsent() {
  const granted = trackingAllowed();
  // Reserved for the inert-embed slice; activation never authorizes analytics.
  state.activationAllowed = state.mode === 'explicit' ? state.activationGranted :
    state.activationType !== 'none' && isConsentGranted(state.activationType);
  if (state.loaded) {
    callInWindow('consentAwareYouTube', granted);
  } else if (granted && !state.loading) {
    state.loading = true;
    injectScript(companionUrl, function () {
      state.loading = false;
      state.loaded = true;
      // Re-read consent: the download may have outlived the grant.
      callInWindow('consentAwareYouTube', trackingAllowed());
    }, function () {
      state.loading = false;
    }, companionUrl);
  }
}

syncConsent();
data.gtmOnSuccess();
