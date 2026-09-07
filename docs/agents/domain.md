# Domain docs

This project uses a single context: `CONTEXT.md` at the project root and architectural decision records in `docs/adr/`.

## Before exploring the codebase

Read the root `CONTEXT.md` and any ADRs relevant to the work.

If either is absent, proceed silently. `/domain-modeling` creates the glossary when the first term is resolved and records ADRs when decisions are made.

## Use the glossary vocabulary

Use the terms defined in `CONTEXT.md` in issue titles, proposals, hypotheses, and tests. If a needed concept is missing, check whether it belongs in the project vocabulary and note any gap for `/domain-modeling`.

## Handle ADR conflicts

If a proposal contradicts an existing ADR, identify that ADR and explain why the decision needs reconsideration before proceeding.
