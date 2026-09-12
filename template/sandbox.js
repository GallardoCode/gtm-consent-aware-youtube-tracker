const isConsentGranted = require('isConsentGranted');
const addConsentListener = require('addConsentListener');
const injectScript = require('injectScript');
const callInWindow = require('callInWindow');
const templateStorage = require('templateStorage');
const companionUrl = '__COMPANION_URL__';

let state = templateStorage.getItem('tracker');
if (!state) {
  state = { loading: false, loaded: false };
  templateStorage.setItem('tracker', state);
  addConsentListener('analytics_storage', syncConsent);
}

function syncConsent() {
  const granted = isConsentGranted('analytics_storage');
  if (state.loaded) {
    callInWindow('consentAwareYouTube', granted);
  } else if (granted && !state.loading) {
    state.loading = true;
    injectScript(companionUrl, function () {
      state.loading = false;
      state.loaded = true;
      // Re-read consent: the download may have outlived the grant.
      callInWindow('consentAwareYouTube', isConsentGranted('analytics_storage'));
    }, function () {
      state.loading = false;
    }, companionUrl);
  }
}

syncConsent();
data.gtmOnSuccess();
