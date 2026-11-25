# Dual install entry points: global side-effect default, plus a non-global named export

The real GPT library only exists as a global installed by a script tag, so application code under test expects `window.googletag` to already be there. We made the package's default entry point install `googletag` onto the global namespace as a side effect of import, matching that contract so app code needs no changes to run against the mock. We also bundle that default entry point as a standalone UMD/IIFE file so it can be dropped in via a plain `<script src>` tag, replacing the real GPT script URL directly in end-to-end tests that don't go through a bundler.

Alongside that, we expose a separate named export that returns a `googletag`-shaped object without touching the global namespace at all, for unit tests that want to construct/control an instance explicitly rather than polluting `window`.

## Considered Options

- Explicit-install-only (`installMockGpt()` required, no side effect ever) — rejected: most consumers are app code expecting the real bootstrap contract, and an opt-in-only API would make the common case the awkward one.
- Side-effect-only (no non-global export) — rejected: unit tests that want an isolated instance without global pollution would have no way to get one.
