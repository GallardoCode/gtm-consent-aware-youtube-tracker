# Support live and inert YouTube embeds

Make consent-gated API loading and tracking of existing live iframes the primary use case, with inert activation as an optional feature for developers who want to delay the player itself. A guarantee that media does not load before consent applies only to supported inert embeds under this integration's control; the tracker cannot undo a live iframe's earlier requests. Recommend YouTube's privacy-enhanced URLs with their personalization limits, and credit Cookiebot's documented iframe-blocking pattern in the optional developer instructions.
