# Set up the tracker in GTM

This project targets GTM web containers. CMP-neutral means you can use different consent platforms within GTM.

The [implementation slice](demo.md) provides an importable template and companion for one existing iframe and play events. It supports native consent requirements and explicit CMP booleans. This guide also describes the remaining first-release design. Inert activation, continuous discovery, and full playback reporting are not available in the slice. The original prototype does not enforce consent.

## 1. Set consent defaults before the tracker runs

Use your CMP's supported GTM integration where available. Its consent tag should set defaults on **Consent Initialization - All Pages**. Set every consent type the tracker checks to denied while the visitor's choice is unknown. GTM treats an unset type as granted. [Google's consent API](https://developers.google.com/tag-platform/tag-manager/templates/api#isconsentgranted)

If you manage defaults in page code, put this inline script in `<head>` before your existing GTM container snippet:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
</script>
<!-- Your existing GTM container snippet goes here. -->
```

This follows [Google's GTM page-code example](https://developers.google.com/tag-platform/security/guides/consent#implementation_example). The `gtag` helper queues commands for GTM; it needs no separate `gtag.js` loader. The example uses the standard `dataLayer` name. Add defaults for any other consent types you select.

Keep defaults coordinated with your CMP. If its integration already sets them correctly, another default block is unnecessary. The CMP must apply saved choices, grants, and withdrawals. This tracker only reads consent.

Do not put this snippet in a GTM Custom HTML tag. Consent templates inside GTM use `setDefaultConsentState` and `updateConsentState` to preserve consent ordering. [Google's template guidance](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis)

## 2. Configure the tracker tag

Create one tracker tag in your GTM web container with these settings:

| Setting | Recommended value |
| --- | --- |
| Trigger | DOM Ready, all pages. See [trigger options](#choose-when-the-tracker-starts). |
| Consent input | GTM Consent Mode |
| Required tracking consent | `analytics_storage`, plus any requirements from your site's policy |
| Advanced Settings > Consent Settings > Additional Consent Checks | No additional consent required |
| Advanced Settings > Tag firing options | Once per event |
| YouTube activation permission | Not configured. Reserved for the later [inert-embed slice](inert-embeds.md). |

The tag must execute while denied to register consent listeners. Its internal checks gate IFrame API loading, player listeners, and playback events. Consent changes then take effect automatically. [GTM consent settings](https://support.google.com/tagmanager/answer/10718549?hl=en)

For explicit CMP inputs instead, map the CMP's grant values to booleans using GTM variables. Supply initial values on your chosen page trigger. Add a Custom Event trigger for your site's consent-update event and push the current values with that event, including withdrawals. Do not filter the trigger to grants only. These updates can also execute the tag before the page trigger fires. [GTM data-layer processing](https://developers.google.com/tag-platform/tag-manager/datalayer#how_data_layer_information_is_processed)

Use one configuration per page. Repeat executions reuse the tracker and update consent. A later conflicting mode, native requirement set, or activation type fails with a Preview console diagnostic. The original policy remains active. Reload the page after changing configuration; changing explicit boolean values is an ordinary consent update.

### Native consent requirements

Choose **GTM Consent Mode**. `analytics_storage` is always required. The **Additional tracking requirements** table offers `ad_storage`, `ad_user_data`, `ad_personalization`, `functionality_storage`, `personalization_storage`, and `security_storage`. The template declares read permission for all seven types and no write permission. There is no custom-name field. These are the only native names supported by this version.

Every configured tracking requirement must permit tracking. A change to any selected type reevaluates the complete requirement, so a partial grant cannot authorize loading. Duplicate rows and row order do not change the policy. Set defaults for every selected type before the first execution; the tracker never establishes site-wide defaults. Unset native types count as granted, and an unset-to-granted update does not invoke a consent listener. [Google's consent listeners](https://developers.google.com/tag-platform/tag-manager/templates/api#addconsentlistener)

### Explicit CMP booleans

Choose **Explicit CMP inputs**. In **Tracking permission**, select a GTM variable that returns a boolean. The default **Denied** option authorizes nothing. Only JavaScript `true` authorizes tracking. `false`, missing values, `null`, strings such as `"true"` or `"granted"`, numbers, arrays, and objects deny it. Configure a Lookup Table or Custom JavaScript variable to convert your CMP's documented values to booleans before this field. Do not type a grant string into the tag.

For a CMP that already supplies booleans, create a Version 2 Data Layer Variable for `site_analytics_allowed`. Select it in **Tracking permission**. If you need the reserved activation policy, create another for `site_youtube_allowed` and select it in **YouTube activation permission**.

Supply the current values before your selected page trigger, including a returning visitor's saved choice. On every subsequent change, push the complete values in the same message as your site's consent-update event. For example, if your site uses `site_consent_updated`:

```js
window.dataLayer.push({
  event: 'site_consent_updated',
  site_analytics_allowed: false,
  site_youtube_allowed: true
});
```

These values permit YouTube activation in the reserved policy and deny analytics. Replace the keys and event name with your CMP integration's names. Create a Custom Event trigger matching that event, with no grant-only filter, and attach it to the same tracker tag. Use **Once per event**, including for withdrawals. Keep any native Consent Mode updates coordinated with the CMP; explicit mode reads only its supplied booleans.

A consent-update event may execute the tag before its selected page trigger. It can load the tracker if the iframe is already present and tracking is granted. The later page-trigger execution reads current values and reuses the existing player without duplicate output. This slice rescans on granted executions, but does not yet continuously discover later embeds.

### Validation and activation policy

The native selectors restrict configuration to declared types, and additional rows require a selection. Runtime validation also rejects unknown modes, malformed native tables, and unsupported consent names before registering listeners or loading scripts. Invalid explicit values are treated as denial, including after a previous grant.

The **YouTube activation permission** field is separate from analytics. Native mode offers one installer-selected declared type, or **Not configured**. Explicit mode accepts a separate boolean variable, defaulting to denial. This slice records that permission for later inert-embed work. It does not activate or restore blocked iframes, and activation permission never substitutes for tracking permission. A live iframe's existing playback remains independent of both fields.

### Choose when the tracker starts

Choose one page trigger. We recommend DOM Ready for standard installations. In GTM, create a trigger with type DOM Ready and select All DOM Ready Events.

| Trigger | Benefit | Tradeoff |
| --- | --- | --- |
| Initialization | Earliest startup after Consent Initialization; reduces the gap before tracking can attach. | When consent is already granted, tracker work can compete with initial page loading. |
| Page View | Starts after Initialization without waiting for the full DOM. | Still runs during page construction, with similar potential loading costs. |
| DOM Ready | Waits until the initial HTML has been parsed. | Playback before tracking attaches can be missed. |
| Window Loaded | Delays startup until the page's load event. | Longer tracking delay while resources load; later dynamic embeds still need discovery. |

These triggers schedule startup; consent and player readiness still determine when tracking begins. Reserve Consent Initialization for the CMP or consent-default tags. [Google's trigger definitions](https://support.google.com/tagmanager/answer/7679319?hl=en)

DOM Ready may reduce competition during HTML parsing, but it shifts work later and does not guarantee faster rendering or better responsiveness. It also does not delay existing iframe `src` requests. Compare browser performance recordings on your page, especially with saved consent already granted. Script execution still uses the main thread after DOM Ready. [Google's script-performance guidance](https://web.dev/articles/script-evaluation-and-long-tasks)

In the complete first-release design, the companion will scan existing iframes and watch for additions, removals, and activation after startup. Frames added while tracking consent is denied are picked up when consent arrives. You do not need to refire the tag for each new iframe.

## 3. Prepare existing YouTube iframes

Enable API access in the site's markup:

```html
<iframe
  title="Video title"
  width="560"
  height="315"
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID?enablejsapi=1&amp;origin=https%3A%2F%2Fwww.example.com"
  allowfullscreen
></iframe>
```

Replace the video ID, title, and encoded site origin. Incompatible iframes will be skipped without reloading playback. Exclude players already controlled by other page JavaScript; add `data-consent-youtube-exclude` to the iframe. [YouTube API parameters](https://developers.google.com/youtube/player_parameters#enablejsapi)

We recommend `youtube-nocookie.com` for privacy-enhanced mode. It limits personalization, but does not guarantee zero requests or cookies. An iframe with `src` can load before consent, independently of this tracker. To delay the player itself, use [optional inert embeds](inert-embeds.md). [YouTube embedding guidance](https://support.google.com/youtube/answer/171780?expand=PrivacyEnhancedMode&hl=en-GB)

## 4. Verify in GTM Preview

1. With no saved choice, inspect the event that first executes the tracker in Tag Assistant. Its Consent tab must show every selected type as denied.
2. Grant the required consent. Confirm API loading and `custom_video` events during playback.
3. Withdraw consent. Confirm playback events stop. Test a returning visitor with saved consent too.

To send events onward, create a GTM Custom Event trigger with Event name set to `custom_video`, or your configured event name. Use Data Layer Variables for fields such as `video_status` and attach the trigger to your destination tag. See the [event reference](events.md) for fields and playback rules.

Maintainers should follow the [verification and release procedure](verification.md).
