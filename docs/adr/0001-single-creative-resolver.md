# Single Creative Resolver instead of a per-slot fixture registry

We needed a way for test authors to control what fake creative a slot "serves." The obvious-looking alternative was a fixture registry — something like `setAdForSlot(adUnitPath, response)` — letting a test register a response per ad unit. We rejected that in favor of a single overridable resolver function (`googletag.mock.setCreativeResolver(fn)`) that receives the ad unit path and the slot's configuration (raw sizes, effective sizes, targeting, etc.) and returns a `Promise<{ html, size } | { isEmpty: true }>`.

Per-ad-unit (or per-targeting, per-size, etc.) variation is achieved entirely by branching inside the resolver the test author provides — e.g. `if (adUnitPath === '/1234/leaderboard') return bannerCreative; else return defaultCreative`. There is no second, registry-style API: the resolver is the only customization surface. This is strictly more flexible (branching can key off anything in the slot config, not just ad unit path) while keeping the mock's public surface to a single hook.

## Considered Options

- Per-slot fixture registry (`setAdForSlot`) — rejected: it's a second API alongside the resolver, and it can only key off whatever the registry's own lookup supports (typically just ad unit path), whereas a resolver can branch on anything in the slot's full configuration.
