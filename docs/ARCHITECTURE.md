# Architecture

`mock-gpt` is a TypeScript mock of Google Publisher Tag (`googletag`), for use in place of the real library in tests. `GLOSSARY.md` defines the mock's vocabulary and v1 scope; `docs/adr/` records the rationale behind decisions that had real trade-offs worth remembering. This file covers the rest: tooling choices and current status.

## Tooling

| Concern | Choice | Notes |
|---|---|---|
| Package manager | npm | No multi-package reason to add pnpm/yarn workspaces |
| Build | Vite, library mode | Two configs — `vite.config.ts` emits ES+CJS for both entries; `vite.iife.config.ts` emits the single-entry IIFE bundle (`iife`/`umd` formats require one entry in Vite) |
| Type declarations | `tsc --emitDeclarationOnly` | Avoids adding `vite-plugin-dts` as a dependency — `typescript` is already required regardless |
| Tests | Vitest + jsdom | jsdom chosen over happy-dom for more complete `iframe`/`contentDocument` support, relevant once creative rendering exists |
| Lint/format | ESLint + typescript-eslint + Prettier | Considered Biome for a single dependency, but kept the more mature type-aware lint rules given how much correctness here hinges on matching `@types/google-publisher-tag`'s shapes |

## Status

The v1 display-ad path is implemented and tested: both entry points, `Slot` and `PubAdsService` (full real method surface per ADR-0004, including the legacy setters as inert no-ops per that ADR's scope decision), the event lifecycle (ADR-0005/0006), size mapping + viewport override (ADR-0007), the default creative resolver (ADR-0001) and viewability resolver (ADR-0009), friendly-iframe rendering, the event log, and `googletag.mock.reset()`. `src/create-runtime.test.ts` covers the golden path, the no-compatible-sizes-vs-no-fill distinction, `collapseEmptyDivs`/`enableSingleRequest` enable-order gating, a custom creative resolver override, and reset.

Our own runtime types in `src/types/googletag.ts` are hand-written, not merged with the ambient `@types/google-publisher-tag` namespace — see **ADR-0010** for why. The isolated compat-check program that actually verifies those types against the official ones is still outstanding follow-up work, not yet built.

Out of v1 scope by design (per `GLOSSARY.md`): companion ads, content service, video ads, real SafeFrame sandboxing. `defineOutOfPageSlot` is minimal — it doesn't yet support the `OutOfPageFormat` enum (rewarded/interstitial), which are also out of v1 scope.

CI is intentionally not set up yet. Add it now that there's a real test suite for it to run.
