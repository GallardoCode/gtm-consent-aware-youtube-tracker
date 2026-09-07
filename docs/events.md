# Playback events

This is the agreed event contract for the planned GTM template. The current prototype does not implement all of it. See the [GTM setup guide](developer-guide.md) for consent and triggers.

The default data-layer event is `custom_video`. You can change the name, choose event types, and configure progress milestones. The default milestones are 25%, 50%, and 75%.

| Field | Value |
| --- | --- |
| `event` | Configured event name, default `custom_video`. |
| `video_status` | `play`, `pause`, `complete`, or `progress`. |
| `video_title` | Optional YouTube title, then a developer-supplied fallback, then `YouTube Video`. |
| `video_url` | Video URL. The prototype removes the iframe URL's query string. |
| `video_percent` | Milestone percentage for progress events; rounded playback percentage otherwise. Disabled for marked live streams. |
| `video_duration` | YouTube's reported duration, rounded to seconds. For live streams, this is elapsed broadcast time. |
| `video_current_time` | Playback position, rounded to seconds. |
| `video_provider` | `youtube`. |
| `visible` | Whether the iframe intersects the viewport. This does not measure attention. |

An added iframe identifier will distinguish separate embeds of the same video. Its field name and handling of missing or duplicate HTML IDs remain to be specified.

## Playback rules

- Consent starts observation at the current position. A playing video emits `play` there; earlier events and milestones are not reconstructed. Withdrawal stops events, and regrant follows the same starting rule.
- Milestones measure playback position. Seeking from 10% to 80% can emit 25%, 50%, and 75%. They do not measure how much the visitor watched.
- Each iframe reports actual play and pause transitions independently. Milestones occur once per playback and reset for a new video or replay after completion.
- Later iframe additions, replacements, and activations are discovered. Removal cleans up tracking; repeated tag execution does not add duplicate listeners.
- Explicitly marked live streams retain playback-state events but disable percentages and milestones.

See the [playback decision](adr/0006-report-observed-playback-per-embed.md) for rationale.

## Title and live-stream metadata

The prototype's `getVideoData().title` lookup is undocumented. The tracker will treat it as optional and keep tracking if it fails. YouTube's documented API also has no live-stream status getter; a positive duration does not establish a fixed-length video. Developers must mark live streams explicitly. [YouTube video information](https://developers.google.com/youtube/iframe_api_reference#Retrieving_video_information)

The metadata attribute names and representation of disabled percentage values will be specified with the implementation. See the [metadata decision](adr/0008-treat-youtube-title-retrieval-as-optional.md).
