# Set up the tracker in GTM

This project targets GTM web containers. CMP-neutral means you can use different consent platforms within GTM.

The template and companion are not implemented yet. This guide describes the intended setup. The current prototype does not enforce consent.

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
| Optional inert activation | Disabled unless you configure [inert embeds](inert-embeds.md) |

The tag must execute while denied to register consent listeners. Its internal checks gate IFrame API loading, player listeners, and playback events. Consent changes then take effect automatically. [GTM consent settings](https://support.google.com/tagmanager/answer/10718549?hl=en)

For explicit CMP inputs instead, map the CMP's grant values to booleans using GTM variables. Supply initial values on your chosen page trigger. Add a Custom Event trigger for your site's consent-update event and push the current values with that event, including withdrawals. Do not filter the trigger to grants only. These updates can also execute the tag before the page trigger fires. [GTM data-layer processing](https://developers.google.com/tag-platform/tag-manager/datalayer#how_data_layer_information_is_processed)

Use one configuration per page. Repeat executions reuse the tracker and update consent.

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

With either an early or late trigger, the companion will scan existing iframes and watch for additions, removals, and activation after startup. Frames added while tracking consent is denied are picked up when consent arrives. You do not need to refire the tag for each new iframe.

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

Replace the video ID, title, and encoded site origin. Incompatible iframes will be skipped without reloading playback. Exclude players already controlled by other page JavaScript; the exclusion setting will be documented with the implementation. [YouTube API parameters](https://developers.google.com/youtube/player_parameters#enablejsapi)

We recommend `youtube-nocookie.com` for privacy-enhanced mode. It limits personalization, but does not guarantee zero requests or cookies. An iframe with `src` can load before consent, independently of this tracker. To delay the player itself, use [optional inert embeds](inert-embeds.md). [YouTube embedding guidance](https://support.google.com/youtube/answer/171780?expand=PrivacyEnhancedMode&hl=en-GB)

## 4. Verify in GTM Preview

1. With no saved choice, inspect the event that first executes the tracker in Tag Assistant. Its Consent tab must show every selected type as denied.
2. Grant the required consent. Confirm API loading and `custom_video` events during playback.
3. Withdraw consent. Confirm playback events stop. Test a returning visitor with saved consent too.

To send events onward, create a GTM Custom Event trigger with Event name set to `custom_video`, or your configured event name. Use Data Layer Variables for fields such as `video_status` and attach the trigger to your destination tag. See the [event reference](events.md) for fields and playback rules.

Maintainers should follow the [verification and release procedure](verification.md).
