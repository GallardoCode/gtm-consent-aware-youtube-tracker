# Treat YouTube title retrieval as optional

Retain the prototype's getVideoData title lookup as a guarded optional read, because the documented IFrame API has no title getter and requiring a separate Data API integration would expand setup. Fall back to a developer-supplied title and then "YouTube Video" when the lookup is absent, invalid, or fails, without stopping tracking. Developers explicitly identify live-stream embeds so percentage values and milestones can be disabled without relying on undocumented live detection.
