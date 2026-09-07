# GTM consent-aware YouTube tracker

A Community Template for GTM web containers, designed to load the YouTube IFrame API and track existing iframes after consent. Optional inert embeds will let developers delay the player itself.

## Current status

The project currently contains a browser JavaScript prototype in [`prototype/proto-youtube-tracking-full.js`](prototype/proto-youtube-tracking-full.js).

The prototype connects YouTube iframe players to `window.dataLayer` and emits `custom_video` events for play, pause, completion, and progress at 25%, 50%, and 75%. Events include the video title, URL, duration, current time, and viewport visibility.

Consent gating is not implemented in the current prototype. It loads the YouTube IFrame API and expects `window.dataLayer` to exist. The consent-aware behavior named by this project remains to be built.

## Developer guidance

Read the [GTM setup guide](docs/developer-guide.md) for denied consent defaults, tag settings, iframe markup, and Preview checks. Separate references cover [playback events](docs/events.md) and [optional inert embeds](docs/inert-embeds.md), including Cookiebot's documented pattern.

The agreed v1 design covers ordinary API-enabled iframes, configurable playback events, dynamic iframe discovery, and an optional inert activation mode. Developers must exclude iframe players already controlled by other page JavaScript. Runtime delivery uses a companion pinned to a full Git commit through jsDelivr, with byte verification before each release.

The container maintainer owns CMP setup and consent defaults. Correct initialization matters because GTM treats an unset consent type as granted. The tracker will consume consent states without setting site-wide consent. See the guide before preparing an integration.

The [verification and maintenance guide](docs/verification.md) covers local automation, actual GTM and YouTube checks, release evidence, and the wizard for human-only setup. Design rationale is recorded in [architectural decisions](docs/adr/).

## Project workflow

Track work in [GitHub Issues](https://github.com/GallardoCode/gtm-consent-aware-youtube-tracker/issues).

Engineering skill configuration starts in [`AGENTS.md`](AGENTS.md). The tracker workflow, triage labels, and domain documentation conventions live in [`docs/agents/`](docs/agents/).

## License

See [`LICENSE`](LICENSE).
