// External player simulator: download, API readiness, and player readiness are independent.
window.playerFixture = {
  players: [],
  autoReady: true,
  state: 2,
  time: 12.4,
  duration: 100.4,
  titleMode: 'missing',
  install() {
    window.YT = { Player: class {
      constructor(iframe, options) {
        this.iframe = iframe;
        this.options = options;
        this.listeners = new Map();
        window.playerFixture.players.push(this);
        if (window.playerFixture.autoReady) setTimeout(() => this.ready(), 0);
      }
      ready() { this.options.events.onReady({ target: this }); }
      getIframe() { return this.iframe; }
      getPlayerState() { return window.playerFixture.state; }
      getCurrentTime() { return window.playerFixture.time; }
      getDuration() { return window.playerFixture.duration; }
      getVideoData() {
        if (window.playerFixture.titleMode === 'throw') throw new Error('Metadata unavailable');
        return window.playerFixture.titleMode === 'valid' ? { title: 'YouTube title' } : undefined;
      }
      addEventListener(type, name) {
        if (typeof name !== 'string') throw new Error('Use the documented named listener API');
        this.listeners.set(name, window[name]);
      }
      removeEventListener(type, name) { this.listeners.delete(name); }
      play(time = 12.4) {
        window.playerFixture.state = 1;
        window.playerFixture.time = time;
        this.listeners.forEach((listener) => listener({ target: this, data: 1 }));
      }
      pause() {
        window.playerFixture.state = 2;
        this.listeners.forEach((listener) => listener({ target: this, data: 2 }));
      }
    } };
    window.onYouTubeIframeAPIReady?.();
  },
};
if (!window.deferApiReady) window.playerFixture.install();
