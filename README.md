# GTM consent-aware YouTube tracker

A project for tracking embedded YouTube playback through Google Tag Manager.

## Current status

The project currently contains a browser JavaScript prototype in [`prototype/proto-youtube-tracking-full.js`](prototype/proto-youtube-tracking-full.js).

The prototype connects YouTube iframe players to `window.dataLayer` and emits `custom_video` events for play, pause, completion, and progress at 25%, 50%, and 75%. Events include the video title, URL, duration, current time, and viewport visibility.

Consent gating is not implemented in the current prototype. It loads the YouTube IFrame API and expects `window.dataLayer` to exist. The consent-aware behavior named by this project remains to be built.

## Project workflow

Track work in [GitHub Issues](https://github.com/GallardoCode/gtm-consent-aware-youtube-tracker/issues).

Engineering skill configuration starts in [`AGENTS.md`](AGENTS.md). The tracker workflow, triage labels, and domain documentation conventions live in [`docs/agents/`](docs/agents/).

## License

See [`LICENSE`](LICENSE).
