# Glossary

## googletag (global)
The mock installs a `googletag` object on `window` (or the global object of whatever JS environment it runs in), replicating the real GPT bootstrap contract so application code under test needs no changes to use the mock in place of the real library.

## Command Queue (`googletag.cmd`)
An array-like queue that application code pushes functions onto before the library is "ready." The mock executes queued functions the same way the real GPT bootstrap does.

## v1 Scope
For v1, the mock implements the core display-ad path: `defineSlot`/`defineOutOfPageSlot`, `pubads()` (targeting, refresh, events), `enableServices`/`display`, `sizeMapping`, the slot/pubads event lifecycle (`slotRequested`, `slotResponseReceived`, `slotRenderEnded`, `slotOnload`, `impressionViewable`), plus a config store (see **Config Store**) and SafeFrame surface (see **SafeFrame**).
Explicitly out of scope for v1: companion ads service, content service, video ads, and any real SafeFrame sandboxing/isolation behavior.

## Config Store
The mock's implementation of `googletag.setConfig()`/`getConfig()`. It stores whatever configuration object is passed in, merging each call into existing stored config per top-level key (matching real GPT's merge semantics), and returns it on retrieval. It does not validate, enforce, or act on the values — except for `disableInitialLoad` (see **Disable Initial Load**), the one deliberate exception.

## Disable Initial Load
The one behavioral (non-inert) setting in the **Config Store**. Matches real GPT: settable either via the current API, `googletag.setConfig({ disableInitialLoad: true })`, or the legacy method, `googletag.pubads().disableInitialLoad()` — the mock supports both as equivalent triggers, per real GPT's own backward-compatibility. When enabled, defining/displaying a slot registers it but does not invoke the Creative Resolver; the resolver only runs when `refresh()` is explicitly called on the slot.

## `googletag.mock` namespace
A mock-only namespace, separate from the real-API-shaped surface on `googletag` itself, holding controls that have no equivalent in the real GPT API: `setCreativeResolver(fn)`, the default resolver's delay setting, `setViewportDimensions(width, height)`, `setViewabilityResolver(fn)`, and `reset()` (see **Creative Resolver**, **Viewport Override**, **Viewability Resolver**, **Mock Reset**).

## Creative Resolver
The single mechanism for customizing mock responses (there is no separate per-slot fixture registry). A function, settable via `googletag.mock.setCreativeResolver(fn)`, that receives the ad unit path and the slot's configuration — including both the slot's raw requested sizes and the mock-resolved **Effective Sizes** — and returns a `Promise` resolving to either `{ html, size }` or `{ isEmpty: true }` (no-fill). The mock uses this result both to render the iframe content and to populate fields on simulated `slotRenderEnded`/`slotOnload` event payloads. Per-ad-unit customization is achieved by branching inside a custom resolver, not via a second API.

If no override is set, a default resolver returns a generic **Placeholder Creative**. The default resolver's resolution delay is configurable via a setting in the `googletag.mock` namespace (an artificial timeout, off by default); custom resolvers control their own timing by how quickly their promise resolves — the mock imposes no delay on them.

## Placeholder Creative
The default fake creative produced by the default Creative Resolver when no override is supplied — shows identifying info about the slot (at minimum) rather than an arbitrary blank response.

## Effective Sizes
The concrete size list the mock computes by evaluating a slot's `sizeMapping` against the current viewport, before invoking the Creative Resolver — matching real GPT's own size-mapping evaluation behavior. Passed to the resolver alongside the slot's raw, unevaluated requested sizes.

## Viewport Override (`googletag.mock.setViewportDimensions`)
Overrides the width/height used when evaluating a slot's `sizeMapping` into **Effective Sizes**, taking precedence over the real `window.innerWidth`/`window.innerHeight` whenever set. Exists because test environments like jsdom have a fixed default viewport that can't be meaningfully resized, so without this override only one `sizeMapping` breakpoint could ever be exercised in unit tests. Cleared by **Mock Reset**.

## Viewability Resolver
A mock-only customization point for `impressionViewable`, settable via `googletag.mock.setViewabilityResolver(fn)`. Receives the slot and returns a `Promise<void>` that the mock awaits before dispatching `impressionViewable`; if no override is set, the default resolver resolves immediately, treating every rendered slot as viewable right away. A resolver that never resolves simply means `impressionViewable` never fires for that slot. Mirrors the **Creative Resolver** pattern — a single overridable function rather than a separate API.

## Mock Reset (`googletag.mock.reset()`)
Clears all defined slots, targeting, config, resolver overrides (both the **Creative Resolver** and the **Viewability Resolver**), and the **Viewport Override** back to defaults, empties the DOM divs that slots had rendered into, and clears the **Mock Event Log** — giving test suites a clean `googletag` state between test cases without reloading the page/module.

## Install Entry Points
The package ships two ways to get a `googletag`: a default entry point that installs it onto the global namespace as a side effect of import (for app code expecting the real bootstrap contract), and a separate named export that returns a `googletag`-shaped object without touching the global namespace (for unit tests that want to avoid polluting global state). The default entry point is also bundled as a standalone UMD/IIFE script, so it can be loaded via a plain `<script src>` tag in place of the real GPT script URL.

## Missing Target Div
If `display()`/slot rendering runs but the target element id doesn't exist in the DOM, the mock logs a console warning and no-ops (no auto-created div, nothing thrown).

## Mock Event Log (`googletag.mock.events`)
A mock-only introspection list on the `googletag.mock` namespace. A new entry is appended whenever a slot is registered (`defineSlot`/`defineOutOfPageSlot`) or whenever the mock dispatches a pubads event (`slotRequested`, `slotResponseReceived`, `slotRenderEnded`, `slotOnload`, `impressionViewable`, etc.). Cleared by **Mock Reset**. Exact entry shape still TBD.

## SafeFrame
`setSafeFrameConfig`-style support is config-only: a stored setting only (consistent with **Config Store**: write/read, no behavioral effect). Final for v1 — creatives always render via the plain friendly-iframe mechanism regardless of this setting; no sandboxed-iframe isolation is implemented.
