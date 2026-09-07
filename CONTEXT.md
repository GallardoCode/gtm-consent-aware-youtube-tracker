# Consent-aware YouTube tracking

This project primarily tracks existing YouTube embeds after consent. Optional inert embeds separate permission to activate YouTube from permission to track playback.

## Language

**Live embed**:
A YouTube embed already able to load media independently of this tracker. "Live" describes its activation state, not whether the video is a live stream.

**Inert embed**:
A YouTube embed kept inactive until YouTube activation permission is granted. Being inert describes whether media can load, not whether analytics is enabled.
_Avoid_: Untracked embed

**YouTube activation permission**:
The visitor's permission for the site to activate YouTube, expressed through the site's chosen CMP category or service. This is a project concept, not a prescribed CMP consent category.
_Avoid_: Media consent as a standard consent type

**Analytics consent**:
The visitor's permission for this tracker to observe playback and emit playback events. It applies to both live and inert embeds.

**Playback event**:
A report of a playback state or progress milestone for a video embed.

**Playback**:
A viewing attempt for one video in one embed. A different video or a replay after completion starts another playback; pausing and resuming does not.

**Progress milestone**:
A configured percentage of a video's playback position reached during a playback. Seeking can reach a milestone, so it does not measure the amount watched.
_Avoid_: Watch coverage, percentage watched

**Observation start**:
The point at which this tracker begins or resumes observing playback with analytics consent. Earlier activity and milestones are not reconstructed.

**Live stream**:
A video broadcast while it is being produced, without a fixed final duration during the broadcast. Playback-position percentages do not describe completion of a live stream.

**Privacy-enhanced mode**:
YouTube's embedding mode that limits how embedded views influence personalization. It is not a promise of zero requests or cookies.
_Avoid_: No-tracking mode, cookie-free mode
