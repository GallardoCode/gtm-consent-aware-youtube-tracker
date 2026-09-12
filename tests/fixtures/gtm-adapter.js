// This adapter models external GTM APIs. Actual sandbox permissions need GTM Preview.
(() => {
  const storage = new Map();
  const listeners = [];
  const consent = new Map([['analytics_storage', false]]);
  let source;
  const api = {
    templateStorage: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    isConsentGranted: (type) => consent.get(type) !== false,
    getType: (value) => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value,
    logToConsole: (...args) => console.warn(...args),
    addConsentListener: (type, listener) => listeners.push({type, listener}),
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
    async runTemplate(config = {}) {
      if (!source) {
        const template = await (await fetch('/template.tpl')).text();
        source = template.split('___SANDBOXED_JS_FOR_WEB_TEMPLATE___')[1]
          .split('___WEB_PERMISSIONS___')[0];
      }
      new Function('require', 'data', source)((name) => {
        if (!(name in api)) throw new Error('Unmodelled GTM API: ' + name);
        return api[name];
      }, { ...config, gtmOnSuccess() {}, gtmOnFailure() { throw new Error('Tag failed'); } });
    },
    setConsent(value, type = 'analytics_storage') {
      const previous = consent.get(type);
      consent.set(type, value);
      if ((previous !== false) !== (value !== false)) {
        listeners.filter((entry) => entry.type === type).forEach((entry) => entry.listener(type, value !== false));
      }
    },
    consentListenerCount: () => listeners.length,
  };
})();
