# Support Consent Mode and explicit consent inputs

Support GTM Consent Mode states and explicit CMP-neutral grant signals in GTM web containers. The container maintainer owns CMP setup and initialization of every selected consent type before tracker execution, including denied defaults while the visitor's choice is unknown; this tracker only consumes consent states. Explain the importance of initialization in the repository's developer documentation because GTM treats unset types as granted, and keep consent-setting APIs outside this tag.

## Trigger contract

Establish defaults through the CMP's consent template on Consent Initialization, or in coordinated page code before the GTM container snippet. Recommend DOM Ready for tracker startup, with Initialization available for earlier observation. Page View and Window Loaded are also supported choices. Document their loading and observation tradeoffs without promising a performance improvement. Continuous iframe discovery handles frames added after any chosen trigger.

Permit the tag's consent-watching code to execute while consent is denied, and let its own checks gate external loading and tracking. Consent Mode listeners handle subsequent grants and withdrawals automatically. Explicit inputs require the initial state and tag execution on every consent change, including withdrawal, using the installer's event name. Consent-update events can execute the tag before its chosen page trigger. Every trigger choice relies on the maintainer establishing consent defaults before execution.
