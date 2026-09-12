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
  "description": "Tracks play events from one existing API-enabled YouTube iframe using native consent requirements or explicit boolean CMP inputs. Set native defaults before execution.",
  "containerContexts": [
    "WEB"
  ]
}

___TEMPLATE_PARAMETERS___

[
  {
    "type": "SELECT",
    "name": "consentMode",
    "displayName": "Consent input",
    "defaultValue": "native",
    "selectItems": [
      {
        "value": "native",
        "displayValue": "GTM Consent Mode"
      },
      {
        "value": "explicit",
        "displayValue": "Explicit CMP inputs"
      }
    ]
  },
  {
    "type": "SIMPLE_TABLE",
    "name": "additionalConsentTypes",
    "displayName": "Additional tracking requirements",
    "help": "analytics_storage is always required in native mode. Every selected type must permit tracking.",
    "enablingConditions": [
      {
        "paramName": "consentMode",
        "paramValue": "native",
        "type": "EQUALS"
      }
    ],
    "simpleTableColumns": [
      {
        "defaultValue": "",
        "selectItems": [
          {
            "value": "ad_storage",
            "displayValue": "ad_storage"
          },
          {
            "value": "ad_user_data",
            "displayValue": "ad_user_data"
          },
          {
            "value": "ad_personalization",
            "displayValue": "ad_personalization"
          },
          {
            "value": "functionality_storage",
            "displayValue": "functionality_storage"
          },
          {
            "value": "personalization_storage",
            "displayValue": "personalization_storage"
          },
          {
            "value": "security_storage",
            "displayValue": "security_storage"
          }
        ],
        "valueValidators": [
          {
            "type": "NON_EMPTY"
          }
        ],
        "type": "SELECT",
        "name": "consentType",
        "displayName": "Consent type",
        "isUnique": true
      }
    ]
  },
  {
    "type": "SELECT",
    "macrosInSelect": true,
    "defaultValue": false,
    "selectItems": [
      {
        "value": false,
        "displayValue": "Denied"
      }
    ],
    "name": "trackingGranted",
    "displayName": "Tracking permission",
    "simpleValueType": true,
    "enablingConditions": [
      {
        "paramName": "consentMode",
        "paramValue": "explicit",
        "type": "EQUALS"
      }
    ],
    "help": "Choose a GTM variable returning boolean true or false. Only boolean true permits tracking; strings and missing values deny it."
  },
  {
    "type": "SELECT",
    "name": "activationConsentType",
    "displayName": "YouTube activation permission (reserved)",
    "defaultValue": "none",
    "enablingConditions": [
      {
        "paramName": "consentMode",
        "paramValue": "native",
        "type": "EQUALS"
      }
    ],
    "selectItems": [
      {
        "value": "none",
        "displayValue": "Not configured"
      },
      {
        "value": "analytics_storage",
        "displayValue": "analytics_storage"
      },
      {
        "value": "ad_storage",
        "displayValue": "ad_storage"
      },
      {
        "value": "ad_user_data",
        "displayValue": "ad_user_data"
      },
      {
        "value": "ad_personalization",
        "displayValue": "ad_personalization"
      },
      {
        "value": "functionality_storage",
        "displayValue": "functionality_storage"
      },
      {
        "value": "personalization_storage",
        "displayValue": "personalization_storage"
      },
      {
        "value": "security_storage",
        "displayValue": "security_storage"
      }
    ],
    "help": "Choose the consent type your site uses for YouTube activation. This version records the separate policy but does not activate inert embeds."
  },
  {
    "type": "SELECT",
    "macrosInSelect": true,
    "defaultValue": false,
    "selectItems": [
      {
        "value": false,
        "displayValue": "Denied"
      }
    ],
    "name": "activationGranted",
    "displayName": "YouTube activation permission (reserved)",
    "simpleValueType": true,
    "enablingConditions": [
      {
        "paramName": "consentMode",
        "paramValue": "explicit",
        "type": "EQUALS"
      }
    ],
    "help": "Optional GTM boolean variable for YouTube activation. Independent of tracking permission; this version does not activate inert embeds."
  }
]

___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const isConsentGranted = require('isConsentGranted');
const addConsentListener = require('addConsentListener');
const injectScript = require('injectScript');
const callInWindow = require('callInWindow');
const templateStorage = require('templateStorage');
const companionUrl = 'https://cdn.jsdelivr.net/gh/GallardoCode/gtm-consent-aware-youtube-tracker@ec54ced8ce500e7828c8ac7618232c4c41ba7c78/companion/youtube-tracker.js';

const getType = require('getType');
const logToConsole = require('logToConsole');
const nativeTypes = ["analytics_storage","ad_storage","ad_user_data","ad_personalization","functionality_storage","personalization_storage","security_storage"];
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
              },
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
                    "string": "ad_storage"
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
              },
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
                    "string": "ad_user_data"
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
              },
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
                    "string": "ad_personalization"
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
              },
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
                    "string": "functionality_storage"
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
              },
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
                    "string": "personalization_storage"
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
              },
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
                    "string": "security_storage"
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
  },
  {
    "instance": {
      "key": {
        "publicId": "logging",
        "versionId": "1"
      },
      "param": [
        {
          "key": "environments",
          "value": {
            "type": 1,
            "string": "debug"
          }
        }
      ]
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
    require('templateStorage').clear();
    mock('isConsentGranted', false);
    runCode({});
    assertApi('addConsentListener').wasCalled();
    assertApi('injectScript').wasNotCalled();
    assertApi('callInWindow').wasNotCalled();
    assertApi('gtmOnSuccess').wasCalled();
- name: A saved grant loads and calls the named bridge
  code: |-
    require('templateStorage').clear();
    mock('isConsentGranted', true);
    mock('injectScript', function(url, success) { success(); });
    runCode({});
    assertApi('injectScript').wasCalled();
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', true);
- name: Later grant and withdrawal both reach the companion
  code: |-
    require('templateStorage').clear();
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
    require('templateStorage').clear();
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
    require('templateStorage').clear();
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
    require('templateStorage').clear();
    let downloads = 0;
    mock('isConsentGranted', true);
    mock('injectScript', function(url, success, failure) { downloads++; failure(); });
    runCode({});
    runCode({});
    assertThat(downloads).isEqualTo(2);
    assertApi('callInWindow').wasNotCalled();
- name: Explicit inputs require boolean true and update after every execution
  code: |-
    require('templateStorage').clear();
    mock('isConsentGranted', true);
    mock('injectScript', function(url, success) { success(); });
    runCode({consentMode: 'explicit', trackingGranted: 'true'});
    assertApi('injectScript').wasNotCalled();
    runCode({consentMode: 'explicit', trackingGranted: true});
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', true);
    runCode({consentMode: 'explicit', trackingGranted: false});
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', false);
    assertApi('addConsentListener').wasNotCalled();
- name: Every native requirement is reread on partial grants and withdrawals
  code: |-
    require('templateStorage').clear();
    let analytics = false;
    let ads = false;
    let listeners = {};
    mock('isConsentGranted', function(type) {
      return type === 'analytics_storage' ? analytics : ads;
    });
    mock('addConsentListener', function(type, callback) { listeners[type] = callback; });
    mock('injectScript', function(url, success) { success(); });
    runCode({additionalConsentTypes: [{consentType: 'ad_storage'}]});
    analytics = true;
    listeners.analytics_storage('analytics_storage', true);
    assertApi('injectScript').wasNotCalled();
    ads = true;
    listeners.ad_storage('ad_storage', true);
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', true);
    analytics = false;
    listeners.analytics_storage('analytics_storage', false);
    assertApi('callInWindow').wasCalledWith('consentAwareYouTube', false);
    listeners.ad_storage('ad_storage', true);
    assertApi('gtmOnSuccess').wasCalled();
- name: Invalid policies fail before loading or registering consent listeners
  code: |-
    const invalid = [
      {consentMode: 'unknown'}, {consentMode: null},
      {additionalConsentTypes: 'ad_storage'},
      {additionalConsentTypes: [null]},
      {additionalConsentTypes: [{consentType: 'custom_media'}]},
      {activationConsentType: 'custom_media'}
    ];
    mock('isConsentGranted', true);
    invalid.forEach(function(config) {
      require('templateStorage').clear();
      runCode(config);
    });
    assertApi('injectScript').wasNotCalled();
    assertApi('addConsentListener').wasNotCalled();
    assertApi('gtmOnFailure').wasCalled();
- name: A conflicting policy is rejected while the original policy still handles withdrawal
  code: |-
    require('templateStorage').clear();
    let last;
    mock('injectScript', function(url, success) { success(); });
    mock('callInWindow', function(name, value) { last = value; });
    runCode({consentMode: 'explicit', trackingGranted: true});
    runCode({consentMode: 'native'});
    assertApi('gtmOnFailure').wasCalled();
    runCode({consentMode: 'explicit', trackingGranted: false});
    assertThat(last).isFalse();
- name: Explicit withdrawal during download uses the latest execution values
  code: |-
    require('templateStorage').clear();
    let loaded;
    let last;
    mock('injectScript', function(url, success) { loaded = success; });
    mock('callInWindow', function(name, value) { last = value; });
    runCode({consentMode: 'explicit', trackingGranted: true});
    runCode({consentMode: 'explicit', trackingGranted: false, activationGranted: true});
    loaded();
    assertThat(last).isFalse();
    runCode({consentMode: 'explicit', trackingGranted: true});
    assertThat(last).isTrue();
- name: Activation permission stays independent and equivalent native policies reuse listeners
  code: |-
    require('templateStorage').clear();
    let analytics = false;
    let activation = true;
    let listeners = {};
    let count = 0;
    let last;
    mock('isConsentGranted', function(type) { return type === 'analytics_storage' ? analytics : activation; });
    mock('addConsentListener', function(type, listener) { listeners[type] = listener; count++; });
    mock('injectScript', function(url, success) { success(); });
    mock('callInWindow', function(name, value) { last = value; });
    runCode({activationConsentType: 'ad_storage'});
    assertApi('injectScript').wasNotCalled();
    activation = false;
    analytics = true;
    listeners.analytics_storage('analytics_storage', true);
    assertThat(last).isTrue();
    listeners.ad_storage('ad_storage', false);
    assertThat(last).isTrue();
    runCode({activationConsentType: 'ad_storage', additionalConsentTypes: [{consentType: 'analytics_storage'}]});
    assertThat(count).isEqualTo(2);
