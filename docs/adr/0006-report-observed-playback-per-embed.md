# Report observed playback separately for each embed

Begin or resume observation at the current position after analytics consent, reporting play if the video is playing but never reconstructing earlier activity or milestones. Preserve progress as playback position, including seeks, with each milestone reported once per playback for each embed and reset for a new video or a replay after completion. Report actual play and pause transitions independently for each embed, because the prototype's URL-wide suppression loses activity from repeated playback and separate copies of the same video.
