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

The two entry points (default side-effect install, named factory export) and the build/type/lint tooling are in place. The core mock behavior — slots, `pubads()`, events, config, size mapping, creative rendering — isn't designed or implemented yet; `create-runtime.ts` is currently a placeholder returning just a working command queue. Each of those pieces should get the same treatment as the decisions in `docs/adr/` before being built — trade-offs considered and recorded where they're real, not formalized where they aren't.

CI is intentionally not set up yet — there's no real test suite for it to run against. Add it once core implementation exists.
