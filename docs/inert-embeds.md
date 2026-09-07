# Delay YouTube iframe loading until consent

An inert embed stores its YouTube URL in a data attribute instead of `src`. The browser does not load that URL until an integration copies it to `src` after consent. The HTML `inert` attribute does not block network requests.

Credit for this documented consent-blocking pattern goes to [Cookiebot's YouTube example](https://support.cookiebot.com/hc/en-us/articles/360003790854-Iframe-cookie-consent-with-YouTube-example). YouTube's own embedding guide does not prescribe it.

## Let your CMP activate the iframe

For Cookiebot, adapt its documented markup:

```html
<iframe
  title="Video title"
  width="560"
  height="315"
  data-cookieblock-src="https://www.youtube-nocookie.com/embed/VIDEO_ID?enablejsapi=1&amp;origin=https%3A%2F%2Fwww.example.com"
  data-cookieconsent="marketing"
  allowfullscreen
></iframe>
```

Replace the video ID, title, and encoded site origin. `marketing` follows Cookiebot's example; use your site's configured category. Cookiebot must be installed to activate this markup. It handles new and saved grants; the tracker attaches after activation when tracking consent permits.

For another CMP, use its documented blocking mechanism. Cookiebot is not a tracker dependency.

## Let this tracker activate the iframe

This optional mode is planned and disabled by default. Once implemented, it will use separate markup:

```html
<iframe
  title="Video title"
  width="560"
  height="315"
  data-consent-youtube-src="https://www.youtube-nocookie.com/embed/VIDEO_ID?enablejsapi=1&amp;origin=https%3A%2F%2Fwww.example.com"
  allowfullscreen
></iframe>
```

Replace the example values, enable inert activation in the GTM tag, and select the consent condition your site uses for YouTube. That permission controls activation independently of analytics consent. Withdrawing it restores only the inert embeds this tracker activated. CMP-owned blocked attributes stay under the CMP's control.

Provide a placeholder and a button that opens your CMP's preferences. Use text or a site-hosted image; a YouTube-hosted thumbnail would contact YouTube before consent.

Return to the [GTM setup guide](developer-guide.md) for consent defaults and tag settings.
