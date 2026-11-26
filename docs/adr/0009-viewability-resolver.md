# Overridable viewability resolver for impressionViewable, defaulting to auto-fire

Real GPT fires `impressionViewable` based on actual on-screen intersection (Active View criteria), which the mock has no way to genuinely measure — jsdom has no real layout or intersection-observer-driven geometry. Rather than choosing between "always assume viewable" and "never fire unless manually triggered," `googletag.mock` exposes a single overridable function, `setViewabilityResolver(fn)`, mirroring the Creative Resolver pattern from **ADR-0001**: a function receiving the `Slot` and returning a `Promise<void>` that the mock awaits before dispatching `impressionViewable`.

The default implementation resolves immediately — auto-fire, assumed-viewable — so the common case needs no setup. A test author who wants real geometry-based viewability can override it with a function that inspects the slot's DOM element (e.g. via `getBoundingClientRect()`) and only resolves once genuinely satisfied — or never resolves, in which case `impressionViewable` simply never fires for that slot, with no special-casing required.

This keeps the "single overridable function, not a second API" precedent from ADR-0001 rather than introducing a different customization shape just because the concern (visibility over time) differs from the concern (resolved creative content).

## Considered Options

- Always auto-fire immediately after `slotOnload`, no override — rejected: forecloses ever testing viewability-dependent logic (e.g. viewability-gated billing or lazy-rendered creatives) against anything but the always-viewable assumption.
- Require an explicit manual trigger (`googletag.mock.triggerImpressionViewable(slot)`), no automatic behavior — rejected: adds friction for the common case of a test just wanting to see the full event lifecycle fire, when most tests don't care about viewability specifics.
