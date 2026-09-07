# Shared workflow

This document is the single shared workflow policy for any agent host used in this repository.

## Discovery and delegation

Load this policy through the active host's instruction mechanism before starting repository work. Preserve existing repository guidance. Any host-specific discovery files needed in the future should contain only pointers to shared instructions.

When delegating work, include this document or a pointer to it in the task brief.

## Tracker and domain conventions

- Before reading, creating, or updating issues or specs, follow the configured [issue tracker](issue-tracker.md).
- Before triaging or applying labels, follow the configured [triage vocabulary](triage-labels.md).
- Before exploring the codebase or proposing changes, follow the [domain documentation conventions](domain.md).

## Skill ownership

Matt Pocock owns `tdd` and `teach`. Use their implementations from `mattpocock/skills`.

Pstack calls to `tdd` must use Matt Pocock's version, including calls made by delegated agents. Resolve duplicate skill names by this source ownership.

## Model selection

Use the active host's model defaults unless explicitly configured otherwise. This applies to direct work, pstack roles, and delegated agents. Keep the workflow usable across hosts without requiring separate pstack model configuration or repository-specific model mappings.

If a skill cannot run without explicit configuration, report the specific requirement. Create model configuration only when explicitly requested, and use overrides supported by the active host.
