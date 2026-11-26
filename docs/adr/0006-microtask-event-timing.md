# Microtask-based, zero-delay-by-default event scheduling

Dispatch of slot/pubads lifecycle events that follow an async step (e.g. `slotRequested` after `display()`, or after a Creative Resolver's promise settles) runs through a microtask (`Promise.resolve().then(...)`/`queueMicrotask`) rather than a macrotask (`setTimeout`), with no artificial delay by default.

Microtasks are unaffected by fake-timer libraries — vitest/jest fake timers only mock `setTimeout`/`setInterval`, never the microtask queue — so a test that does `await slot.refresh()` resolves reliably regardless of whether the suite has installed fake timers. This avoids a common failure mode where a test silently hangs because fake timers were enabled but never advanced. It's also consistent with the default Creative Resolver's delay setting (Glossary: Creative Resolver) already being "off by default": the mock is deterministic and fast by default, and any added realism (delay) is something a test author opts into explicitly rather than something imposed on every test.

## Considered Options

- Macrotask-based (`setTimeout`) scheduling as the default — rejected: more faithful to real GPT's actual network-delay timing, but requires every test to explicitly drive fake timers just to observe any event, which is unnecessary friction for the common case of fast, synchronous-feeling unit tests.
