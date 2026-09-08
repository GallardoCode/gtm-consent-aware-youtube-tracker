# GTM consent-aware YouTube tracker

A Community Template for GTM web containers, designed to load the YouTube IFrame API and track existing iframes after consent. Optional inert embeds will let developers delay the player itself.

## Current status

Issue [#2](https://github.com/GallardoCode/gtm-consent-aware-youtube-tracker/issues/2) implements the first working slice. Import [`template.tpl`](template.tpl) to observe `custom_video` play events from one existing API-enabled iframe. Native Consent Mode requires `analytics_storage`. Withdrawal removes the playback listener; regrant observes the current position.

This is an implementation slice, not the full first release or a Gallery publication. Explicit consent inputs, additional consent types, multiple and dynamic embeds, inert activation, configurable events, pause/completion/progress reporting, and live-stream metadata remain in parent [#1](https://github.com/GallardoCode/gtm-consent-aware-youtube-tracker/issues/1). Use the slice with one ordinary, fixed-duration video present at DOM Ready.

The original [`prototype/`](prototype/proto-youtube-tracking-full.js) remains a behavioral reference and does not enforce consent.

## Run the slice

Use Node.js 24 or later:

```sh
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm test
npm run demo
```

Open http://127.0.0.1:4173 for a local demo with real YouTube and a modelled GTM consent API. The [installation and demo procedure](docs/demo.md) covers actual GTM integration. Run `bash scripts/verify-gtm.sh` for the account, template import, and Preview steps. Those checks remain a human verification gate; local tests do not enforce Google's sandbox permissions.

## Developer guidance

Read the [GTM setup guide](docs/developer-guide.md) for denied consent defaults, tag settings, iframe markup, and Preview checks. Separate references cover [playback events](docs/events.md) and [optional inert embeds](docs/inert-embeds.md), including Cookiebot's documented pattern.

The agreed v1 design covers ordinary API-enabled iframes, configurable playback events, dynamic iframe discovery, and an optional inert activation mode. Developers must exclude iframe players already controlled by other page JavaScript. Runtime delivery uses a companion pinned to a full Git commit through jsDelivr, with byte verification before each release.

The container maintainer owns CMP setup and consent defaults. Correct initialization matters because GTM treats an unset consent type as granted. The tracker consumes consent states without setting site-wide consent. See the guide before preparing an integration.

The [verification and maintenance guide](docs/verification.md) covers local automation, actual GTM and YouTube checks, release evidence, and the wizard for human-only setup. Design rationale is recorded in [architectural decisions](docs/adr/).

## Project workflow

Track work in [GitHub Issues](https://github.com/GallardoCode/gtm-consent-aware-youtube-tracker/issues).

Engineering skill configuration starts in [`AGENTS.md`](AGENTS.md). The tracker workflow, triage labels, and domain documentation conventions live in [`docs/agents/`](docs/agents/).

## License

See [`LICENSE`](LICENSE).
