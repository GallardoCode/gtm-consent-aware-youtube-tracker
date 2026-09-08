___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.

___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "Consent-aware YouTube tracker (implementation slice)",
  "categories": [
    "ANALYTICS"
  ],
  "description": "Tracks play events from one existing API-enabled YouTube iframe after analytics_storage consent. Set consent defaults before this tag runs.",
  "containerContexts": [
    "WEB"
  ]
}

___TEMPLATE_PARAMETERS___

[]

___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const isConsentGranted = require('isConsentGranted');
const addConsentListener = require('addConsentListener');
const injectScript = require('injectScript');
const callInWindow = require('callInWindow');
const templateStorage = require('templateStorage');
const companionUrl = 'https://cdn.jsdelivr.net/gh/GallardoCode/gtm-consent-aware-youtube-tracker@ec54ced8ce500e7828c8ac7618232c4c41ba7c78/companion/youtube-tracker.js';

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

___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "access_consent",
        "versionId": "1"
      },
      "param": [
        {
          "key": "consentTypes",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "analytics_storage"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "inject_script",
        "versionId": "1"
      },
      "param": [
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://cdn.jsdelivr.net/gh/GallardoCode/gtm-consent-aware-youtube-tracker@ec54ced8ce500e7828c8ac7618232c4c41ba7c78/companion/youtube-tracker.js"
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_globals",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "consentAwareYouTube"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_template_storage",
        "versionId": "1"
      },
      "param": []
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]

___TESTS___

scenarios:
- name: Denied consent registers a watcher without loading
  code: |-
    mock('isConsentGranted', false);
    runCode({});
    assertApi('addConsentListener').wasCalled();
    assertApi('injectScript').wasNotCalled();
    assertApi('callInWindow').wasNotCalled();
    assertApi('gtmOnSuccess').wasCalled();
- name: A saved grant loads and calls the named bridge
  code: |-
    mock('isConsentGranted', true);
    mock('injectScript', function(url, success) { success(); });
    runCode({});
    assertApi('injectScript').wasCalled();
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', true);
- name: Later grant and withdrawal both reach the companion
  code: |-
    let granted = false;
    let listener;
    mock('isConsentGranted', function() { return granted; });
    mock('addConsentListener', function(type, callback) {
      assertThat(type).isEqualTo('analytics_storage');
      listener = callback;
    });
    mock('injectScript', function(url, success) { success(); });
    runCode({});
    granted = true;
    listener('analytics_storage', true);
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', true);
    granted = false;
    listener('analytics_storage', false);
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', false);
- name: Download completion reads current consent after withdrawal
  code: |-
    let granted = true;
    let loaded;
    let listener;
    mock('isConsentGranted', function() { return granted; });
    mock('addConsentListener', function(type, callback) { listener = callback; });
    mock('injectScript', function(url, success) { loaded = success; });
    runCode({});
    granted = false;
    listener('analytics_storage', false);
    loaded();
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', false);
- name: Repeat execution reuses the watcher and pending download
  code: |-
    let listeners = 0;
    let downloads = 0;
    mock('isConsentGranted', true);
    mock('addConsentListener', function() { listeners++; });
    mock('injectScript', function() { downloads++; });
    runCode({});
    runCode({});
    assertThat(listeners).isEqualTo(1);
    assertThat(downloads).isEqualTo(1);
- name: A failed companion download can retry on the next execution
  code: |-
    let downloads = 0;
    mock('isConsentGranted', true);
    mock('injectScript', function(url, success, failure) { downloads++; failure(); });
    runCode({});
    runCode({});
    assertThat(downloads).isEqualTo(2);
    assertApi('callInWindow').wasNotCalled();
