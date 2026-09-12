# Issue #2 verification record

Verified on 2026-09-08 with Node.js 24.18.0, Playwright 1.63.0, and its Chromium build 1243.

- Companion source commit: `ec54ced8ce500e7828c8ac7618232c4c41ba7c78`.
- Tested root template SHA-256: `36c9b3b5c7fd8b107df9f0dd00ba72b6435679fe6bfcb1685339d61e6db5b8d0`.
- `npm run typecheck`: passed.
- `npm test`: 7 local template checks and 15 browser integration cases passed.
- `bash -n scripts/verify-gtm.sh` and `git diff --check`: passed. ShellCheck was unavailable.

This Linux environment lacked `libasound.so.2`. For the browser run, the Ubuntu `libasound2t64` package was extracted under `/tmp/youtube-browser-libs` and supplied through `LD_LIBRARY_PATH=/tmp/youtube-browser-libs/usr/lib/x86_64-linux-gnu`. Normal setup uses `npx playwright install --with-deps chromium`.

## Real YouTube check

The local demo used its modelled GTM adapter with real YouTube on both `www.youtube.com` and `www.youtube-nocookie.com`. Playback produced the prototype-compatible event, withdrawal stopped reporting, and regrant emitted the current playback position. Subsequent pause/play transitions worked. Both pages had no JavaScript errors.

The real-player review repeated three withdrawal/regrant cycles. Parent player subscription counts stayed `[1,1,1,1,1,1,1]`. A stale play callback while paused emitted nothing. These checks exercise the real player, not GTM's sandbox or permissions.

## CDN delivery

`npm run verify:cdn` fetched this exact URL and compared the response with Git's committed artifact and the local companion at 2026-09-08T11:33:58.363Z:

```text
https://cdn.jsdelivr.net/gh/GallardoCode/gtm-consent-aware-youtube-tracker@ec54ced8ce500e7828c8ac7618232c4c41ba7c78/companion/youtube-tracker.js
SHA-256: d93e499a1635b633bf6d21963831fe0869e17590c69cebe1b1fecd0d3d793dee
Bytes: 5157
```

## Standards

The standards review found no documented-standard violations or actionable baseline smells within issue #2's bounded scope. The full first-release behavior remains tracked in parent #1.

## Spec

The initial review found two real-player discrepancies. YouTube retained parent subscriptions after removal, so regrants accumulated listeners. Named callbacks also resolve dynamically, allowing stale events to reach the current callback. The corrected fixture reproduced both failures before their fixes. The companion now registers once and verifies current player state before accepting a queued transition. Real-player rechecks passed on both hosts, with no remaining spec findings.

Standards: 0 remaining findings. Spec: 0 remaining findings.

## Remaining human verification

The maintainer imported the template and ran its six editor tests on 2026-09-12. Four failed because test scenarios shared initialization state; see the follow-up below. The corrected editor tests, Run Code, and container Preview still need maintainer verification. Their prepared procedure is `bash scripts/verify-gtm.sh`. Complete it in a dedicated test workspace and retain its observations before treating this as a validated GTM installation. Account permission checks are not established by the local template runner or the real YouTube probe.

This is an implementation slice. No Gallery release or container publication was performed.

## GTM editor follow-up, 2026-09-12

The maintainer reported two non-function listener errors, a listener count of zero instead of one, and a download count of zero instead of two. Sharing template storage across the local runner's scenarios reproduced all four failures. The earlier runner had incorrectly allocated fresh storage for each scenario, masking the missing test setup.

Each embedded scenario now calls `require('templateStorage').clear()` once before its first `runCode` call. Storage remains shared between calls within a scenario, so the repeated-execution checks still exercise initialization reuse. The local runner now retains storage across scenarios to catch this regression. This reset is test setup only; production initialization and the companion pin are unchanged. [Google's template storage API](https://developers.google.com/tag-platform/tag-manager/templates/api#templatestorage)

The corrected template scenarios, export check, and 15 browser cases pass locally, 22 checks total. Type checking also passes. Reimport the updated root template into the same GTM Template Editor and rerun all six tests to confirm in Google's sandbox.

Updated template SHA-256: `073ed870cbac9adee0847fa5f8dcac4d908eeadd8cb2954eaca52f97488f8158`.
