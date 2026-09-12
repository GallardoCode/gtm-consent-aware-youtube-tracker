// This adapter models external GTM APIs. Actual sandbox permissions need GTM Preview.
(() => {
  const storage = new Map();
  const listeners = [];
  let consent = false;
  let source;
  const api = {
    templateStorage: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    isConsentGranted: () => consent !== false,
    addConsentListener: (type, listener) => listeners.push(listener),
    callInWindow: (name, ...args) => window[name]?.(...args),
    injectScript: (url, success, failure) => {
      const script = document.createElement('script');
      script.src = window.fixtureCompanionUrl || url;
      script.onload = success;
      script.onerror = failure;
      document.head.append(script);
    },
  };
  window.fixture = {
    async runTemplate() {
      if (!source) {
        const template = await (await fetch('/template.tpl')).text();
        source = template.split('___SANDBOXED_JS_FOR_WEB_TEMPLATE___')[1]
          .split('___WEB_PERMISSIONS___')[0];
      }
      new Function('require', 'data', source)((name) => {
        if (!(name in api)) throw new Error('Unmodelled GTM API: ' + name);
        return api[name];
      }, { gtmOnSuccess() {}, gtmOnFailure() { throw new Error('Tag failed'); } });
    },
    setConsent(value) {
      const previous = consent;
      consent = value;
      if (previous !== value) listeners.forEach((listener) => listener('analytics_storage', value));
    },
    consentListenerCount: () => listeners.length,
  };
})();
