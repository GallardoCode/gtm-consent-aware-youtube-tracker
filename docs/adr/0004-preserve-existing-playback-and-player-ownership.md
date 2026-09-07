# Preserve existing playback and player ownership

Stop analytics immediately when its permission is withdrawn, and on withdrawal of YouTube activation permission restore only the inert embeds this tracker activated. Existing live embeds remain under the site or CMP's control. If a live iframe lacks API support, preserve playback, skip tracking, and report the required setup instead of enabling the API through a potentially disruptive reload.

## Players owned by other integrations

V1 automatically manages ordinary API-enabled iframes and reuses the shared YouTube IFrame API when it is already loaded. Developers must explicitly exclude iframes whose player instances are owned by other page JavaScript, because the documented API provides no registry for reliable automatic adoption. Supporting those player instances is deferred to a future explicit handoff mechanism.
