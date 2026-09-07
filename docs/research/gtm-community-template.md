# YouTube Community Template design evidence

Checked 7 September 2026. This document records findings for the design interview; recommendations here are not accepted design decisions.

## Publication requirements

Google requires one root `template.tpl`, root `metadata.yaml`, and a root `LICENSE` containing Apache 2.0 only. Resources belong on `main`. The template needs one to three supported categories. Metadata supplies homepage, documentation, and release commit SHAs. Keep published versions newest first and retain earlier entries. README and release notes are recommended. Issues must remain enabled, and the maintainer should receive review notifications. Submission includes accepting Gallery terms. Thorough testing, style compliance, and a maintenance process are expected. The user approved replacing MIT with Apache 2.0 during the first interview round; the working-tree license now uses the Google-linked sample. [Gallery guide](https://developers.google.com/tag-platform/tag-manager/templates/gallery)

Use an organization plus descriptive functional name, Title Case for the template name, lowerCamelCase parameter IDs, and sentence-case labels and help. Icons must be square PNG, JPEG, or GIF images, 48–96 pixels per side and below 50 KB. Avoid unauthorized official branding. [Style guide](https://developers.google.com/tag-platform/tag-manager/templates/style)

Gallery updates notify users, who choose whether to accept them. Editing an imported template disconnects publisher updates until those local changes are discarded. This affects any installation approach that requires permission edits. [Gallery user guide](https://support.google.com/tagmanager/answer/9454109)

The user accepted semantic version numbers, a changelog, major versions for incompatible event or consent behavior, fixed companion URLs for published releases, and retaining older releases in metadata. Companion hosting was subsequently settled as jsDelivr with a full Git commit pin and pre-publication byte verification. [Release procedure](../verification.md#release-evidence)

## Sandbox and companion boundary

The sandbox has no direct `window` or `document`, no `new`, and no `this`. It cannot run the prototype unchanged. [Sandboxed JavaScript](https://developers.google.com/tag-platform/tag-manager/templates/sandboxed-javascript)

Global permissions authorize named read, write, and execute paths. Their first segment cannot be a predefined browser global, so calling `document.querySelectorAll` through `callInWindow` is not a supported escape. Script injection has URL permissions. [Permissions](https://developers.google.com/tag-platform/tag-manager/templates/permissions)

Google documents external script injection but prefers implementing functionality in the sandbox when possible. Narrow URL permissions reduce the additional trust involved. The reviewed guidance does not guarantee acceptance of this project's companion architecture. [Conversion guide](https://developers.google.com/tag-platform/tag-manager/templates/convert-existing-tag)

Inference: DOM discovery, iframe activation, player construction, and teardown require a page-context companion or an existing site integration. The sandbox can coordinate consent, configuration, and calls through a small named interface. The user selected automatic loading of a companion through jsDelivr at a full Git commit SHA in [ADR-0003](../adr/0003-load-a-version-pinned-companion.md).

jsDelivr documents serving GitHub files with `/gh/user/repo@version/file` and provides an exact full-commit-SHA example. It also offers ranges and latest-version aliases, which would change the loaded code independently of the installed GTM template. Accepted delivery contract: serve a committed companion artifact from this repository at a full commit SHA, with the template's URL and permission limited to that artifact. This adds jsDelivr as a delivery dependency and does not itself establish Gallery approval. [jsDelivr GitHub delivery documentation](https://github.com/jsdelivr/jsdelivr#github)

### Repository deletion and runtime delivery

Google's CustomTemplate resource stores templateData separately from its galleryReference. Inference: deleting the source repository does not itself erase the imported template stored in GTM. Google documents removing Gallery listings by deleting LICENSE or metadata.yaml, but the reviewed guidance does not offer a blanket operational guarantee for repository deletion. An injected external script remains a separate runtime dependency; GTM's template copy does not host it. [CustomTemplate resource](https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces.templates), [Gallery removal](https://developers.google.com/tag-platform/tag-manager/templates/gallery#remove_your_template)

jsDelivr states that it permanently stores requested files and continues serving its stored GitHub files if the repository or release is deleted. This is retained storage beyond an edge cache. A never-fetched artifact still needs its origin for the initial retrieval. Its terms allow service restriction or withdrawal and do not promise uninterrupted availability. [Retention and GitHub delivery](https://github.com/jsdelivr/jsdelivr#github), [service terms](https://github.com/jsdelivr/jsdelivr/blob/master/Terms%20of%20Use.md)

Accepted Q18 release requirement: keep the full-commit jsDelivr URL and fetch the exact artifact before publishing each Gallery version, verifying its bytes against the committed release. This exercises delivery and causes the artifact to be retrieved before users depend on it. It does not guarantee future CDN availability or substitute for maintaining the repository.

Concrete template examples were inspected at both their current default-branch commits and the latest release commits declared in their metadata; the delivery patterns matched. The links below identify the declared release sources, not a claim about all Community Templates.

| Template | Runtime delivery in the inspected release |
| --- | --- |
| [Microsoft Clarity](https://github.com/microsoft/clarity-gtm-template/blob/a4013e4a6b1ae135d6acd80cdb7dd803d849dc54/template.tpl#L180) | Injects `https://www.clarity.ms/tag/{projectId}?ref=gtm`. Microsoft hosts the runtime separately from the template repository. |
| [Official Meta Pixel](https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel/blob/d7103272dc194a9c1bdbeb1c484a1fac4a87fed5/template.tpl#L813) | Injects `https://connect.facebook.net/en_US/fbevents.js`; a conditional integration also loads an AWS-hosted parameter-builder script. These are separate runtime services. |
| [Simo Ahava's Consent Mode](https://github.com/gtm-templates-simo-ahava/consent-mode/blob/2363063bd8cac24c856273b3e2b4714b0b2587a5/template.tpl#L375) | Does not inject an external script. It uses GTM consent APIs and optional data-layer or Microsoft consent forwarding. |

The vendor URLs in these examples are not immutable version URLs. Pinning their template source commits does not pin the fetched vendor script bytes. A template that can do all its work in the sandbox avoids a companion download; this tracker's DOM and player work still requires the boundary selected in ADR-0003.

## Consent and lifecycle facts

`isConsentGranted` treats unset consent as granted and has an always-fire exception. `addConsentListener` excludes unset-to-granted transitions. Therefore a positive check alone cannot establish an explicit affirmative CMP choice. `injectScript` can deduplicate script elements through a cache token, but load completion differs from YouTube API readiness. `templateStorage` shares state across executions of one template. These facilities do not by themselves prevent duplicate player ownership across page integrations. [Template APIs](https://developers.google.com/tag-platform/tag-manager/templates/api)

The consent API does not distinguish a configured grant from an unset type. A Consent Mode input therefore relies on the CMP correctly initializing every selected type before tracker execution. Waiting only for a denied-to-granted transition would miss returning visitors whose consent is already granted. A generic CMP-loaded flag cannot prove that every configured type was initialized. The installation contract and its limits need to be explicit; the tracker must not claim runtime detection of every missing or misspelled mapping. [Consent API semantics](https://developers.google.com/tag-platform/tag-manager/templates/api#isconsentgranted)

Accepted responsibility boundary: the container maintainer configures the CMP and consent defaults. This tracker consumes the supplied states and does not set or update site-wide consent. Documenting prerequisites and testing the tag's response to supplied consent remain in scope. The [developer guide](../developer-guide.md) explains why initialization matters. [ADR-0005](../adr/0005-support-both-consent-input-methods.md)

Accepted primary use case: load the IFrame API and track existing live iframes only after the required consent. In Consent Mode, analytics_storage gates this tracker's API loading, listeners, and events by default, with additional consent requirements configurable. Inert activation is optional and requires an installer-selected YouTube consent condition. [ADR-0001](../adr/0001-support-live-and-inert-embeds.md), [ADR-0002](../adr/0002-separate-youtube-activation-and-analytics.md)

CMP templates can establish defaults during Consent Initialization and update consent with the template consent APIs. Custom consent types are supported. [Consent template guidance](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis)

Google also documents page-level defaults before the GTM container snippet. The inline `gtag` helper queues a consent-default command in `dataLayer` without loading `gtag.js` separately. Coordinate this with the CMP's saved choices and updates; an independent duplicate default block is unnecessary when its integration already establishes defaults correctly. Inside GTM consent templates, use the consent APIs rather than queued `gtag` callbacks. [Google's GTM page-code example](https://developers.google.com/tag-platform/security/guides/consent#implementation_example)

Implementation constraint: the template must declare read permission for each consent type it checks or observes. The reviewed guidance does not establish a blanket permission for arbitrary runtime names. Present declared supported types as selectable choices, and use the accepted explicit-input mode for other CMP signals unless broader permission support is proven. A free-text consent name alone is not a complete integration, and requiring users to edit template permissions would affect Gallery updates. [Consent permission setup](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis), [Gallery updates after local edits](https://support.google.com/tagmanager/answer/9454109)

A tag blocked by an Additional Consent Check does not automatically rerun when consent is granted later. The design must account for a bootstrap or explicit consent-update triggering. [Consent troubleshooting](https://support.google.com/tagmanager/answer/12962079?hl=en)

Accepted trigger contract: establish defaults before GTM in page code or through the CMP template during Consent Initialization. Recommend DOM Ready for tracker startup, with Initialization available for earlier observation and Page View or Window Loaded as other choices. Continuous iframe discovery handles later page changes. DOM Ready defers startup until the initial HTML is parsed; any performance benefit needs measurement on the actual page. See the [trigger comparison](../developer-guide.md#choose-when-the-tracker-starts). [Google's trigger definitions](https://support.google.com/tagmanager/answer/7679319?hl=en)

Permit the tracker's sandbox code to execute while denied by selecting No additional consent required, then let its internal consent checks gate external loading and tracking. Register listeners regardless of the initial state, and recheck the full requirement on every grant or withdrawal. The API's documented always-fire exception must be checked against the actual tag settings in Preview rather than assumed equivalent to a particular UI label. [Consent setup and tag settings](https://support.google.com/tagmanager/answer/10718549?hl=en), [consent listener API](https://developers.google.com/tag-platform/tag-manager/templates/api#addconsentlistener)

For explicit boolean inputs, a changed variable alone does not notify an already executed template. Require initial input plus a change event containing the current consent values on every update, including withdrawal, without a grant-only trigger filter. Use Once per event with internal deduplication, because Once per page would suppress later updates. Same-page withdrawal handling depends on delivery of those events. [Data-layer processing](https://developers.google.com/tag-platform/tag-manager/datalayer#how_data_layer_information_is_processed), [tag firing options](https://support.google.com/tagmanager/answer/6279951?hl=en)

The user accepted one stable tracker configuration per page, with normal consent updates and repeated executions reusing it. A conflicting configuration is rejected with a diagnostic. [ADR-0007](../adr/0007-use-one-tracker-configuration-per-page.md)

Google's documented consent-mode-aware products do not include the YouTube iframe player. Playback permission and analytics permission must be defined by this project's integration contract. [Consent mode concepts](https://developers.google.com/tag-platform/security/concepts/consent-mode)

The earlier phrase "media consent" was a project shorthand, not a standard Consent Mode type. Cookiebot's YouTube example assigns the iframe to its marketing category. Its GTM integration maps marketing to advertising consent types and statistics to analytics_storage, establishes denied defaults on Consent Initialization, and uses cookie_consent_update to trigger consent-dependent tags. These are concrete examples of a CMP using Consent Mode state and events together, not evidence of a universal category mapping or market-wide preference. [Cookiebot iframe example](https://support.cookiebot.com/hc/en-us/articles/360003790854-Iframe-cookie-consent-with-YouTube-example), [Cookiebot GTM deployment](https://support.cookiebot.com/hc/en-us/articles/360003793854-Google-Tag-Manager-deployment)

## YouTube integration facts

The IFrame API exposes readiness, player events, construction around an existing iframe, and player destruction. API control requires enablejsapi; the player parameters documentation calls for the embedding site's origin. Real integration tests should serve a local HTTP page and retain the required referrer identity. [IFrame API](https://developers.google.com/youtube/iframe_api_reference), [player parameters](https://developers.google.com/youtube/player_parameters), [client identity requirements](https://developers.google.com/youtube/terms/required-minimum-functionality#api-client-identity-and-credentials)

Google warns that GTM's option to append enablejsapi=1 can reload a video already playing. YouTube also documents an enablejsapi iframe attribute, but does not promise interruption-free retrofitting of arbitrary live players. The user selected preserving playback and skipping tracking for incompatible live embeds in [ADR-0004](../adr/0004-preserve-existing-playback-and-player-ownership.md). [YouTube trigger guidance](https://support.google.com/tagmanager/answer/7679325?hl=en), [existing-iframe example](https://developers.google.com/youtube/iframe_api_reference#Examples)

The player API exposes listener removal and iframe destruction, but no documented player-instance registry or wrapper disposal method that preserves the iframe. Reusing another integration's player therefore needs an explicit coexistence contract and validation. [Player API operations](https://developers.google.com/youtube/iframe_api_reference#Adding_event_listener)

Accepted Q23 boundary: automatically manage ordinary API-enabled iframes, reuse the shared IFrame API, and require developers to exclude embeds owned by other player integrations. Adopting another integration's player would require an explicit instance handoff and is deferred beyond v1. Do not promise automatic discovery of every external owner. [Player ownership decision](../adr/0004-preserve-existing-playback-and-player-ownership.md#players-owned-by-other-integrations)

The reviewed official IFrame API reference does not document the prototype's getVideoData method, a title getter, or a live-stream status getter. The user accepted an optional guarded title getter, then a developer-supplied title and finally YouTube Video as fallbacks, with failures isolated from tracking. getDuration returns zero before metadata loads and elapsed broadcasting time for live streams, so a positive finite duration does not establish suitability for percentage milestones. [Documented video information and duration](https://developers.google.com/youtube/iframe_api_reference#Retrieving_video_information)

The separate YouTube Data API provides snippet.title and snippet.liveBroadcastContent. Adding that API would expand the integration and is not part of the approved IFrame API architecture. The user accepted an explicit per-iframe live-stream marker that disables percentage values and milestones while preserving playback-state events. [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos#snippet), [ADR-0008](../adr/0008-treat-youtube-title-retrieval-as-optional.md)

Privacy-enhanced mode limits personalization; Google's description does not promise zero requests or zero cookies. [Embedding guidance](https://support.google.com/youtube/answer/171780?expand=PrivacyEnhancedMode&hl=en-GB)

An inert iframe withholds its remote src, retaining the intended URL in a data attribute until the responsible integration receives consent. Cookiebot explicitly documents this pattern using data-src or data-cookieblock-src, a configured consent category, and an optional placeholder. Its script activates eligible frames after consent, including on later visits with saved consent. This establishes a documented CMP integration pattern, not its prevalence across websites. [Cookiebot iframe example](https://support.cookiebot.com/hc/en-us/articles/360003790854-Iframe-cookie-consent-with-YouTube-example)

The reviewed YouTube embedding guide documents ordinary iframe sources and privacy-enhanced mode, but does not prescribe this data-attribute consent pattern. A youtube-nocookie.com URL placed directly in src still loads a player. Withholding src is separate from the HTML inert attribute, which is not a network-blocking mechanism. [YouTube embedding guidance](https://support.google.com/youtube/answer/171780?expand=PrivacyEnhancedMode&hl=en-GB)

The optional [inert-embed instructions](../inert-embeds.md) credit Cookiebot's documented blocking pattern. The user accepted separate data-consent-youtube-src markup for activation owned by this tracker, with that feature disabled by default in the tag. Developers supply placeholders and CMP preferences buttons, and CMP-managed blocked iframes remain under their CMP's control. Use site-hosted placeholder content when avoiding pre-consent YouTube requests; a YouTube-hosted thumbnail would itself contact YouTube infrastructure.

Engineering constraints: a template cannot undo requests already initiated by an iframe src, remote thumbnail, preload, or other page code. A pre-consent request guarantee therefore needs an inert-markup contract and a defined scope. Revocation can stop this component's future activation and event emission, but cannot promise to erase prior cookies or undo in-flight requests.

## Prototype findings

The [behavioral reference](../../prototype/proto-youtube-tracking-full.js) emits `custom_video` events for play, pause, completion, and 25/50/75 percent progress. Progress measures playhead position, including seeking, rather than watched coverage.

Disposable Node VM probes established:

| Scenario | Observed behavior |
| --- | --- |
| Execute with no iframe or consent signal | Loads the YouTube IFrame API immediately |
| Two embeds sharing a URL and repeated play/pause | Emits only one play, pause, complete, and progress set across both |
| Execute twice against two iframes | Constructs four players |
| Change the video in one iframe | Suppresses progress milestones for the replacement video |
| Emit without an existing dataLayer | Throws when calling push |

The script also overwrites the global API-ready callback, scans only existing src-bearing iframes, and provides no timer cleanup or teardown. These findings describe the prototype, not intended release behavior. Syntax checking passes; mocks do not establish actual browser or YouTube behavior.

The user accepted observation from the current position after consent, without historical events; playback-position milestones including seeks; repeated play/pause transitions; and independent milestone counting for each embed and playback. New videos and replays after completion reset milestones. These choices are recorded in [ADR-0006](../adr/0006-report-observed-playback-per-embed.md).

The user also accepted automatic discovery of later iframe additions, replacements, and activations, cleanup on removal, and repeated tag execution without duplicate listeners. Keep custom_video and the existing payload by default, with a configurable event name, enabled event types, milestone percentages, and an added iframe identifier. The [event reference](../events.md) records the intended behavior while implementation remains pending.

## Verification boundaries

Google's template unit tests skip field validation and permission checks on mocked APIs. Template Editor Run Code and actual container integration checks must cover those gaps. [Template tests](https://developers.google.com/tag-platform/tag-manager/templates/tests)

Local feasibility was checked with Node 24.18.0 and Chrome for Testing 151.0.7922.34. The cached headless shell executed JavaScript in an offline fixture and exited successfully after its missing audio library was downloaded from the configured OS package source and extracted to a temporary directory. The probe needed no system installation or manual setup. It establishes browser availability, not tracker, consent, cookie, or GTM correctness. Browser automation and product fixtures still need to be built.

Verification approach following the user's request for automated local testing:

1. Automated consent-state, configuration, event, and repeated-initialization tests.
2. Local browser fixtures with inert embeds and a controlled player API.
3. Fresh browser contexts that observe attempted network requests and cookies separately. Blocking a request in the test runner does not prove the component never attempted it.
4. Controlled real-YouTube and real-GTM checks for behavior mocks cannot establish.

A container ID alone does not grant editor access. Any human-only authentication, template import, Preview, or Gallery submission steps should use the requested wizard after the procedure is settled.

The [verification and maintenance guide](../verification.md) records the planned checks and the evidence required before release. CDN delivery verification does not replace actual GTM or YouTube integration testing.
