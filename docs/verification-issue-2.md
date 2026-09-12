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

The maintainer imported the corrected template and confirmed all six editor tests passing on 2026-09-12 at 13:53:42, as displayed by GTM, followed by a successful Run Code check at 13:55:03. In container Preview, the maintainer confirmed denied startup, later grants, repeated pause/resume, withdrawal, and regrant in both Tag Assistant and the demo panel. Repeated tag execution and the saved-grant/ordinary-host URL remain unconfirmed in the maintainer's Preview session, though covered by the automated and real-player checks above. Detailed network/cookie observations and separate CMP integration checks have not been supplied. Their prepared procedure is `bash scripts/verify-gtm.sh`.

This is an implementation slice. No Gallery release or container publication was performed.

## GTM editor follow-up, 2026-09-12

The maintainer reported two non-function listener errors, a listener count of zero instead of one, and a download count of zero instead of two. Sharing template storage across the local runner's scenarios reproduced all four failures. The earlier runner had incorrectly allocated fresh storage for each scenario, masking the missing test setup.

Each embedded scenario now calls `require('templateStorage').clear()` once before its first `runCode` call. Storage remains shared between calls within a scenario, so the repeated-execution checks still exercise initialization reuse. The local runner now retains storage across scenarios to catch this regression. This reset is test setup only; production initialization and the companion pin are unchanged. [Google's template storage API](https://developers.google.com/tag-platform/tag-manager/templates/api#templatestorage)

The corrected template scenarios, export check, and 15 browser cases pass locally, 22 checks total. Type checking also passes. The maintainer then reran the corrected tests in Google's editor and reported `Executed 6 tests (SUCCESS)` at 13:53:42 on 2026-09-12. All six named scenarios passed. This is maintainer-supplied GTM evidence; mocked test calls still do not establish actual permission enforcement or playback behavior in container Preview.

Updated template SHA-256: `073ed870cbac9adee0847fa5f8dcac4d908eeadd8cb2954eaca52f97488f8158`.

The subsequent Run Code check, reported by the maintainer at 13:55:03 on 2026-09-12, printed `Test started` and `Executed 1 test (SUCCESS)`. This records successful editor execution. Live-page consent changes, companion delivery under container permissions, and playback output remain to be checked in Preview.

## Preview connection investigation, 2026-09-12

The maintainer reached the demo page, but Tag Assistant reported the container not found. An independent Chromium check of the exact demo URL requested the configured `gtm.js`, received HTTP 200, initialized the matching entry in `window.google_tag_manager`, and recorded `gtm.js`, `gtm.dom`, and `gtm.load` with no page errors. The demo used its denied-default path. This check had no authenticated Preview session and does not resolve the maintainer's connection failure.

The investigation then requested the demo URL and the `gtm.js` request status in the maintainer's Preview-opened browser tab. At that point browser blocking was unconfirmed. [Google's connection troubleshooting](https://support.google.com/tagassistant/answer/10039345?hl=en)

A follow-up opened the exact supplied URL including `gtm_debug` in a fresh Chromium session. At five seconds the debug path had not initialized the container. At twenty seconds both the ordinary and debug URLs had initialized it and emitted the GTM lifecycle events. The debug path additionally fetched `/debug/bootstrap`, `/debug/badge.css`, and `/debug/badge`, all with HTTP 200. Neither probe reproduced the maintainer's 307 redirect. The short observation window was insufficient for debug startup; the maintainer's browser-specific redirect and Preview connection remain unverified.

The maintainer subsequently supplied the redirect headers: `307 Internal Redirect`, `non-authoritative-reason: WebRequest API`, and a `location` under `chrome-extension://odfafepnkmbhccpbejgmiehpchacaeak/web_accessible_resources/google-analytics_analytics.js` (query omitted). This confirms that an extension replaced the GTM request with its own script. The extension ID matches [uBlock Origin's Edge listing](https://microsoftedge.microsoft.com/addons/detail/odfafepnkmbhccpbejgmiehpchacaeak). Its [documented large power button](https://github.com/gorhill/uBlock/wiki/Quick-guide:-popup-user-interface#the-large-power-button) disables filtering for the current site. The maintainer confirmed that uBlock caused the connection problem and proceeded with Preview playback checks. No template change was needed for this redirect.

## Preview playback follow-up, 2026-09-12

The maintainer reported no playback events while initially denied, events in both Tag Assistant and the demo panel after granting consent, and further events on repeated pause/resume. Withdrawal stopped reporting in both places. After regrant, `custom_video` continued appearing in Tag Assistant. The maintainer initially reported that the demo panel stopped updating, then corrected that report and confirmed it was working. The display investigation is closed without a code change; the reported grant/withdrawal/regrant sequence passed in both displays.

Two independent browser probes did not reproduce the display discrepancy. The public GTM runtime with explicitly supplied `custom_video` messages retained matching panel and data-layer contents across grant/withdrawal/regrant. The local GTM adapter with real YouTube playback also matched the displayed and emitted event counts after three withdrawal/regrant cycles: 2, 3, then 4, with no page errors. Neither probe used the maintainer's authenticated Preview session. The requested comparison of displayed and data-layer events became unnecessary after the maintainer corrected the report.
