// @ts-check
(function () {
  /** @typedef {{getPlayerState(): number, getCurrentTime(): number, getDuration(): number,
   * getVideoData?: () => {title?: unknown}, addEventListener(type: string, name: string): void}} Player */
  /** @typedef {{target: Player, data?: number}} PlayerEvent */
  /** @type {Window & typeof globalThis & {
   * consentAwareYouTube?: (granted: boolean) => void,
   * YT?: {Player: new (iframe: HTMLIFrameElement, options: {events: {onReady(event: PlayerEvent): void}}) => Player},
   * dataLayer?: object[],
   * __consentAwareYouTubeState?: (event: PlayerEvent) => void
   * }} */
  var page = window;
  if (page.consentAwareYouTube) return;

  var granted = false;
  /** @type {HTMLIFrameElement | undefined} */
  var iframe;
  /** @type {Player | undefined} */
  var player;
  var playerReady = false;
  var listening = false;
  var observing = false;
  var playing = false;
  var epoch = 0;
  var apiTimer = 0;
  var listenerName = '__consentAwareYouTubeState';

  function reportPlay() {
    if (!granted || !iframe || !player) return;
    var duration = player.getDuration();
    var time = player.getCurrentTime();
    var title = iframe.title.trim() || 'YouTube Video';
    try {
      var metadata = player.getVideoData && player.getVideoData();
      if (metadata && typeof metadata.title === 'string' && metadata.title.trim()) {
        title = metadata.title;
      }
    } catch (_) {
      // Optional, undocumented metadata must not prevent playback reporting.
    }
    var bounds = iframe.getBoundingClientRect();
    page.dataLayer = page.dataLayer || [];
    page.dataLayer.push({
      event: 'custom_video',
      video_status: 'play',
      video_title: title,
      video_url: iframe.src.split('?')[0],
      video_percent: duration > 0 ? Math.round(time / duration * 100) : 0,
      video_duration: Math.round(duration),
      video_current_time: Math.round(time),
      video_provider: 'youtube',
      visible: bounds.top < page.innerHeight && bounds.bottom > 0 &&
        bounds.left < page.innerWidth && bounds.right > 0,
    });
  }

  function observe() {
    if (!granted || !playerReady || !player || observing) return;
    observing = true;
    var observation = epoch;
    page.__consentAwareYouTubeState = function (event) {
      if (!granted || observation !== epoch || event.target !== player) return;
      // YouTube resolves named callbacks at dispatch time, even for queued events.
      if (event.data !== player.getPlayerState()) return;
      if (event.data === 1 && !playing) reportPlay();
      playing = event.data === 1;
    };
    if (!listening) {
      player.addEventListener('onStateChange', listenerName);
      listening = true;
    }
    playing = player.getPlayerState() === 1;
    if (playing) reportPlay();
  }

  function connect() {
    apiTimer = 0;
    if (!granted || !iframe) return;
    if (!page.YT || typeof page.YT.Player !== 'function') {
      apiTimer = page.setTimeout(connect, 50);
      return;
    }
    if (!player) {
      player = new page.YT.Player(iframe, {
        events: { onReady: function () {
          playerReady = true;
          observe();
        } },
      });
    }
    observe();
  }

  function start() {
    if (!iframe) {
      var frames = document.querySelectorAll('iframe');
      for (var index = 0; index < frames.length; index++) {
        var candidate = frames[index];
        if (candidate.hasAttribute('data-consent-youtube-exclude')) continue;
        var url;
        try { url = new URL(candidate.src); } catch (_) { continue; }
        if (!/^www\.youtube(?:-nocookie)?\.com$/.test(url.hostname) ||
            !url.pathname.startsWith('/embed/')) continue;
        if (url.protocol !== 'https:' || url.searchParams.get('enablejsapi') !== '1' ||
            url.searchParams.get('origin') !== page.location.origin) {
          console.warn('YouTube tracker: skipped iframe. Set enablejsapi=1 and the page origin in site markup.');
          continue;
        }
        iframe = candidate;
        break;
      }
    }
    if (!iframe) return;
    if (!page.YT || typeof page.YT.Player !== 'function') {
      var existing = Array.from(document.scripts).some(function (script) {
        return /^https:\/\/www\.youtube\.com\/(iframe_api|player_api)([?#]|$)/.test(script.src);
      });
      if (!existing) {
        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onerror = function () {
          page.clearTimeout(apiTimer);
          apiTimer = 0;
          script.remove();
          console.warn('YouTube tracker: IFrame API download failed. Execute the tag again to retry.');
        };
        document.head.appendChild(script);
      }
    }
    if (!apiTimer) connect();
  }

  page.consentAwareYouTube = function (value) {
    var next = value === true;
    if (next !== granted) epoch++;
    granted = next;
    if (!granted) {
      page.clearTimeout(apiTimer);
      apiTimer = 0;
      observing = false;
      playing = false;
      page.__consentAwareYouTubeState = function () {};
      return;
    }
    start();
  };
})();
