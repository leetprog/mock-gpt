# Real window dimensions by default, with a mock-namespace override

**Effective Sizes** (Glossary) are computed by evaluating a slot's `sizeMapping` against the current viewport. The mock reads `window.innerWidth`/`window.innerHeight` for this by default, matching real GPT exactly for browser and e2e use with no extra API required.

Alongside that, `googletag.mock` exposes `setViewportDimensions(width, height)`, which takes precedence over the real window dimensions whenever set. This matters because jsdom — the test environment — has a fixed, small default viewport (1024×768) that can't practically be resized within a unit test; without an override, a test author could never exercise `sizeMapping` breakpoints other than whatever matches that one fixed size. This follows the same pattern already established for the default Creative Resolver's delay setting: faithful real-world behavior by default, with a deterministic test-only escape hatch living in the `googletag.mock` namespace rather than on the real API surface.

## Considered Options

- Real window only, no override — rejected: unit tests under jsdom would be permanently stuck at jsdom's one fixed viewport size, unable to exercise more than one `sizeMapping` breakpoint.
- Explicit-config-only, no implicit window read — rejected: diverges from real GPT's automatic viewport-driven behavior by default, risking a test that passes against the mock but would resolve a different `sizeMapping` entry against the real tag in an actually-sized browser.
