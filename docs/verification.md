# Verification and maintenance

The issue #2 slice now has executable template and browser tests. Run `npm run typecheck`, `npm run test:template`, and `npm run test:browser`; `npm test` runs both suites. See the [slice demo and evidence](demo.md) for its supported scope and the remaining real GTM checks. The broader procedure below applies to the complete first-release design.

## Continuous integration

The [CI workflow](../.github/workflows/ci.yml) runs on pull requests targeting `main`, pushes to `main`, and manual dispatch. Its `Tests and typecheck` job uses Ubuntu 24.04 and Node.js 24, installs locked dependencies with `npm ci`, runs type checking, installs Chromium and its system dependencies, and runs the template and browser suites. Browser tests use one worker and retain traces on failure.

Check the job result in the PR's Checks tab. If browser tests fail, download `playwright-failure-report` from the workflow run's Artifacts section. It is retained for seven days. After extracting it, run `npx playwright show-report path/to/playwright-report` to inspect the report. These controlled tests do not require GTM credentials and do not replace the real GTM and YouTube verification below.

## Automated local checks

Test the observable behavior through the template and companion boundaries:

- Start with consent denied, already granted, and later changed. Cover grant, withdrawal, regrant, and withdrawal while scripts or players are still loading. No stale completion callback may start tracking after withdrawal.
- Verify both Consent Mode and explicit inputs. Check every selected consent requirement and delivery of explicit withdrawal events. Invalid configuration or inputs must not authorize tracking.
- Observe attempted network requests before consent. For existing live embeds, compare the page's existing activity with the tracker's added activity. For controlled inert embeds, verify that the tracker does not activate the iframe before its activation permission.
- Inspect cookies separately from requests. A request blocked by the test runner is still an attempted request and must not count as proof that the tracker avoided it.
- Check repeated tag execution, two copies of the same video, later iframe additions and removals, video changes, and conflicting configurations. Assert player and listener counts as well as emitted events.
- Verify reuse of an already loaded IFrame API and preservation of existing API-ready callbacks. Explicitly excluded embeds owned by another integration must receive no player wrapper, tracking listeners, or iframe changes from this tracker.
- Test consent granted during playback, pause and resume, seeking across milestones, replay after completion, and regrant at a later position. Do not reconstruct events or milestones from unobserved activity.
- Verify event configuration, metadata fallbacks, missing or duplicate iframe IDs, and explicitly marked live streams. An absent or throwing optional title getter must not stop playback tracking.
- Verify that incompatible live iframes are not reloaded and that withdrawal restores only inert embeds activated by this tracker.

Use controlled player fixtures for deterministic failures and consent races. Supplement them with real browser integration; a mock player cannot prove compatibility with YouTube's player implementation.

## Real GTM and YouTube checks

Run the template's embedded unit tests, Template Editor Run Code, and controlled container Preview checks. Google's unit tests do not check field validation, and mocked APIs bypass permission checks, so local or mocked success alone is insufficient. [Google's template testing limitations](https://developers.google.com/tag-platform/tag-manager/templates/tests)

Test both defaults paths: page code before the GTM snippet, and a CMP consent template on Consent Initialization. In Tag Assistant, inspect the event that first executes the tracker and confirm every required type already has its intended consent state. Confirm that consent listeners initialize while denied, that external loading waits for the required grant, and that both input modes stop tracking after withdrawal. Check returning visitors whose consent is already granted.

Cover DOM Ready, Initialization, Page View, and Window Loaded startup. Verify discovery during HTML parsing and after page load, including a page with no initial iframes. Consent granted before tag startup must be read correctly; earlier playback must not be reconstructed. In explicit-input mode, cover a consent-update event that runs before the selected page trigger and confirm the later execution reuses the tracker. Compare performance recordings with saved consent granted before making claims about trigger timing and page speed.

Serve a test page over HTTP with a valid embedding origin and referrer. Confirm player readiness and actual playback events, API reuse, dynamic iframe discovery, and preservation of existing playback. Cover ordinary and privacy-enhanced YouTube URLs, the optional inert mode, and explicit exclusion of externally owned players.

Use a dedicated test workspace and page for container integration. Automate the available steps. When authentication, template import, Preview interaction, or Gallery submission needs a human, generate the requested wizard around the prepared artifacts and exact remaining steps. A container ID does not grant editing access.

## Release evidence

1. Record the tested source revision and results from local, template, and real integration checks.
2. Verify the root template.tpl, metadata.yaml, Apache 2.0 LICENSE, documentation links, style, and declared permissions against the current Gallery requirements.
3. Fetch the exact jsDelivr companion URL pinned to the full Git commit. Compare the response bytes with the committed artifact and record the URL and checksum. This checks delivery and causes jsDelivr to retrieve the artifact before users depend on it.
4. Verify that the template and its permissions reference that same companion URL. Recheck the actual release artifact if release preparation changes executable content or permissions.
5. Add the tested template commit to metadata in newest-first order, retain prior releases, and include change notes and the semantic version. Companion and template commits may differ because the template records the companion's already known commit.

These are separate checks: CDN byte verification proves delivery of the selected file, while GTM and browser checks establish integration behavior. Gallery acceptance remains Google's review decision. [Gallery publication requirements](https://developers.google.com/tag-platform/tag-manager/templates/gallery)

## Maintenance

Keep GitHub Issues enabled and follow the configured issue and triage workflow. Include the template version and a minimal reproduction when investigating a report, without requesting visitor data or secrets.

Recheck Google requirements and relevant YouTube and GTM API behavior before releases. Repeat real integration checks after changes affecting consent, player lifecycle, permissions, or script loading. Keep the optional title getter's failure path covered because it is undocumented.

Publish fixes as new versions and preserve previously published companion URLs. Use a major version for incompatible event or consent behavior, and explain the migration in the changelog. Document CDN incidents and known integration limits so maintainers can distinguish delivery failures from tracker defects.

Users choose when to accept Gallery template updates. Each installed version must continue to use its pinned companion URL. [Google's update process](https://developers.google.com/tag-platform/tag-manager/templates/gallery#update_your_template)
