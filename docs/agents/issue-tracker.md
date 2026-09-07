# Issue tracker: GitHub

Issues and specs live in `GallardoCode/gtm-consent-aware-youtube-tracker` on GitHub. Use the `gh` CLI.

Run commands from this clone so `gh` resolves the repository from `origin`. From another directory, pass `--repo GallardoCode/gtm-consent-aware-youtube-tracker` to `gh issue` and `gh pr` commands.

## Issue operations

- Create: `gh issue create --title "..." --body-file <path>`.
- Read the body and labels: `gh issue view <number> --json number,title,body,labels,state`.
- Read the conversation: `gh issue view <number> --comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`. Add `--label` filters as needed.
- Comment: `gh issue comment <number> --body-file <path>`.
- Apply or remove a label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`. Read `triage-labels.md` for the vocabulary.
- Close: `gh issue close <number>`. Post any required explanation first.

Write multiline bodies to a temporary file and pass its path with `--body-file`.

## Pull requests in triage

**PRs as a request surface: no.**

Set this flag to `yes` if external PRs should enter the triage queue. When enabled, use the `gh pr` equivalents for reading, commenting, labeling, and closing. Read proposed code with `gh pr diff <number>`.

For queue discovery, keep PRs whose `authorAssociation` is `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`. Explicitly named PRs can be reviewed regardless of the author's association.

GitHub issues and PRs share a number space. For an ambiguous reference such as `#42`, try `gh pr view 42`, then `gh issue view 42`.

## Skill conventions

When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the relevant ticket", read the issue body, labels, and comments.

## Wayfinding operations

Used by `/wayfinder`.

- Map: one issue labeled `wayfinder:map`, with Notes, Decisions-so-far, and Fog sections.
- Child ticket: one issue per question, linked to the map as a GitHub sub-issue through `gh api`. If sub-issues are unavailable, list children in the map's task list and put `Part of #<map>` in each child's body.
- Ticket type: use `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`. Create these labels when first needed.
- Blocking: use GitHub issue dependencies through `gh api`, with issue database IDs. If unavailable, record `Blocked by: #<number>, #<number>` near the top of the child. A ticket is unblocked when every blocker is closed.
- Next ticket: inspect the map's open children in map order and choose the first with no open blockers and no assignee.
- Claim: run `gh issue edit <number> --add-assignee @me` before starting work.
- Resolve: post the answer as a comment, close the child, then append the result and a link to the map's Decisions-so-far section.
