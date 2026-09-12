# Install and verify the first slice

This implements issue #2, the first path through the larger [first-release spec](https://github.com/GallardoCode/gtm-consent-aware-youtube-tracker/issues/1). It observes one existing API-enabled iframe and emits `custom_video` play events. All settings are fixed for this slice: native `analytics_storage`, the standard `dataLayer`, and the `custom_video` event name.

## Local commands

Use Node.js 24 or later. Install with `npm ci` and `npx playwright install --with-deps chromium`. Then run:

```sh
npm run typecheck
npm run test:template
npm run test:browser -- tests/consent.spec.js
npm test
npm run demo
```

Open http://127.0.0.1:4173. The default demo uses the local companion, real YouTube, and a model of the GTM consent APIs. Press Play, grant analytics, withdraw, then regrant. The event panel shows a count and the newest event first. Its count should stop increasing on withdrawal. Regrant while the video is playing should add one event at the current position; read the first entry's `video_current_time`. Use `?consent=granted` for a saved grant and `?host=youtube.com` for the ordinary host. The default uses privacy-enhanced mode.

## Import into a test GTM workspace

1. Run `bash scripts/verify-gtm.sh`. It guides the account and Preview steps and records your observations in ignored `.env.gtm-demo`. Keep the demo server running in another terminal.
2. In a dedicated web-container workspace, open Templates, create a new tag template, and use the editor's More Actions menu to import root `template.tpl`. [Google's import example](https://codelabs.developers.google.com/codelabs/web-vitals-ga4-publisher)
3. Inspect Permissions. Expect read access only to `analytics_storage`, script injection for one exact jsDelivr URL, execute access only to `consentAwareYouTube`, and template storage. Follow [the editor test steps below](#run-the-tests-after-import) for the six imported tests and the separate Run Code check.
4. Create one tag using this template. Fire on DOM Ready, all pages, with Once per event and Additional Consent Checks set to **No additional consent required**. Add a Custom Event trigger for `tracker_demo_repeat` to exercise the Repeat button. Tag success means the consent watcher is registered, not that YouTube is ready.
5. Open Preview and connect to `http://127.0.0.1:4173/?gtm=GTM-YOURID`. The demo establishes denied page defaults before loading that container. This mode uses the real template and pinned CDN companion. Inspect the first tracker event's Consent tab. Grant, play, withdraw, and regrant using the page buttons. Inspect network attempts, iframe behavior, cookies, and data-layer events. [Google's Preview procedure](https://support.google.com/tagmanager/answer/6107056?hl=en)
6. Repeat with `&consent=granted` and `&host=youtube.com`. In a separate test page, verify your CMP consent template's defaults on Consent Initialization and its saved-choice and withdrawal behavior. Keep that page's defaults coordinated with its CMP.

The tracker never sets site-wide consent. Native GTM treats unset consent types as granted; the maintainer must establish defaults before any tracker execution. There is no extra explicit-grant or CMP-readiness gate. Follow the [pre-container defaults example and CMP alternative](developer-guide.md#1-set-consent-defaults-before-the-tracker-runs).

### Run the tests after import

GTM keeps a copy of the `.tpl` file at import time. Editing or pushing the repository does not update that copy. After a template fix, open the existing Template Editor, use **More Actions > Import**, and select the updated root `template.tpl` again. For the test-isolation fix, expand the first test and confirm its first line is `require('templateStorage').clear();` before running the tests.

Open **Templates** in the workspace's left navigation, then click the imported tracker under **Tag Templates**. In its Template Editor:

1. Click **Tests**. Six tests should already be listed, starting with `Denied consent registers a watcher without loading` and ending with `A failed companion download can retry on the next execution`. Do not add new tests. An empty list means you should check that the complete root `template.tpl` was imported.
2. Ensure all six tests are enabled, then click **Run Tests**, the button with a play triangle. It runs every enabled test. No local server, video playback, consent buttons, or tag configuration is needed for these simulated scenarios.
3. Read the editor's **Console** results. Expect six tests run and zero failures. For a failure, expand the test row and copy its name and the full error. Hover over a row to reveal its individual play button if you want to rerun only that test. [Google's test controls](https://developers.google.com/tag-platform/tag-manager/templates/tests)
4. Separately, click **Code**, leave the imported code unchanged, then click **Run Code**. This template has no configuration fields to fill in. Check the editor's Console for compilation, runtime, and permission errors. A video event is not expected in the editor. [Google's Run Code instructions](https://developers.google.com/tag-platform/tag-manager/templates)
5. Record the two outcomes separately in the wizard. If either fails, retain the error before proceeding to tag configuration. If both pass, click **Save**.

The six tests simulate the external APIs. Mocked calls bypass GTM permission checks, so their success does not replace the later container Preview checks.

## Existing iframe prerequisites

Use an HTTPS `www.youtube.com/embed/VIDEO_ID` or `www.youtube-nocookie.com/embed/VIDEO_ID` URL with `enablejsapi=1` and an `origin` query parameter exactly matching the containing page's origin. Supply a valid embedding referrer. Put the iframe in the page before DOM Ready. Unsupported embeds are skipped with a console diagnostic; the tracker does not rewrite their URLs. [YouTube's API prerequisites](https://developers.google.com/youtube/iframe_api_reference#Requirements)

The tracker uses the first eligible iframe. Mark iframes owned by other page JavaScript with `data-consent-youtube-exclude`. Keep this slice's selected iframe and video stable for the page lifetime. Later discovery, removal/replacement cleanup, and multiple embeds belong to later slices.

The optional YouTube title lookup falls back to the iframe's `title`, then `YouTube Video`. Missing, invalid, or throwing metadata does not stop reporting. Use fixed-duration videos; live-stream metadata and disabled percentages are still pending.

## Delivery and bridge

`template/sandbox.js` owns consent and shares initialization through GTM template storage. `companion/youtube-tracker.js` defines the named page function `consentAwareYouTube(granted)`. Loading the companion alone does no player work. The template invokes it only with the current consent value, including after a delayed download. Withdrawal replaces the named analytics callback with a no-op and cancels readiness polling. One player subscription remains dormant until regrant. YouTube retains its parent subscription after a removal command, so the companion registers only once and reuses it. Regrant checks current player state before accepting a queued event. The player wrapper remains so regrant does not interrupt the existing iframe.

The companion waits separately for `YT.Player` readiness and preserves the page's existing API-ready callback. It reuses an existing `iframe_api` or `player_api` script. Its own failed API download can retry on the next tag execution or grant. Companion injection failure can also retry on the next execution or grant.

To update delivery, commit the companion first, then run `npm run template:build -- FULL_COMPANION_COMMIT_SHA`. Push that commit and run `npm run verify:cdn`. This fetches the exact jsDelivr URL and compares it with both Git's committed bytes and the local companion. Commit the regenerated template separately. Never use a branch name or a shortened SHA for production delivery.

The template permits only that exact URL. The companion runs in page context and loads YouTube's API after consent; the GTM sandbox does not constrain the companion's own DOM work. jsDelivr and YouTube are external runtime dependencies. Preserve published pins, and follow the [release verification procedure](verification.md#release-evidence) before a Gallery release.

## What the automated evidence proves

The browser suite executes the actual exported template code and companion together. Only the external GTM and YouTube APIs are simulated. Cases cover denied and saved consent, native unset-as-granted behavior, later grants, withdrawal during each loading phase, stale state callbacks, regrant at the current position, repeated execution, API reuse, both hosts, unsupported/excluded embeds, and optional title failures.

The fixture records external requests with Playwright's request event before routing responses. Its baseline contains an existing iframe navigation and image request. Denied tracker execution must add no external request. It also compares cookies and iframe markup independently. These controlled responses do not reproduce YouTube's actual traffic or cookie behavior. A blocked request is still an attempt. Existing iframe requests and cookies can precede consent independently of this tracker; withdrawal cannot undo them or in-flight traffic.

The local template runner executes the six exported tests and checks that the code, tests, and narrow permission declarations match their sources. It does not reproduce Google's sandbox. Actual import, Run Code, permission enforcement, and Preview require the wizard and must be recorded as pending until a maintainer completes them. This slice is not a Gallery release.

The [issue #2 verification record](verification-issue-2.md) records the tested source, real-player checks, CDN checksum, review results, and remaining GTM account checks.
