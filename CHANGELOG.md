# Daily backbone — Stage 1

## Added
- Main Today view, three explicitly marked sample bites, energy and wake check-in.
- Timestamp-based persistent timer, pause/resume, recovery, session completion and break.
- Manual logs with 14-day backfill, edit, deletion tombstones and undo.
- Stable event IDs, per-user local persistence, Cloud retry synchronization and server last-write-wins guards.
- Negative Konkur scoring and comparison without penalties; deterministic completion and follow-up test bites.
- Day summary and seven-day planned/actual totals with per-subject hours.
- User-scoped bites, bite_progress and bite_logs; additive references on existing activity/log/settings records.

## Preserved
- Original daily logs and weekly plans are not rewritten or deleted. Stable provenance adapters avoid migrating twice.
- Pension page and original tools remain available; classic daily clock/poster is on Study Desk.

## Verification
- 11 rule/store tests passed.
- Signed-in browser: timer reload recovery, negative score, log readback, edit, delete/undo and offline edits/reconnect checked.
- Mobile: no document overflow; bottom navigation visible.

## Still pending within Stage 1
- A fully cached offline cold start after closing the browser (current offline edits work in the loaded app).
- Full reconciliation with separate legacy timer activities; imported snapshots preserve aggregate values but cannot recover missing answer breakdowns.
- Subject-specific visual colors, celebratory confetti, richer weekly heatmap and Jalali input picker refinements.
- Advisor messages are local deterministic encouragement; streaming advisor is Stage 5.

## Needs review / user input
- The three sample bites have no guessed page numbers and are marked needs_review.
- Real catalog JSON/PDF budgets are deliberately deferred to Stage 2.
