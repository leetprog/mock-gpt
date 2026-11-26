# Custom minimal event emitter instead of native EventTarget

Real GPT's `addEventListener` callbacks receive plain objects (`slot`, `isEmpty`, `size`, etc.), not DOM `Event`/`CustomEvent` instances — confirmed by the public API reference and by `@types/google-publisher-tag`'s event interfaces, which don't extend `Event`. Given **ADR-0003**'s commitment to structural type compatibility, the mock's dispatch mechanism needs to preserve that contract at runtime too, not just in type declarations: listeners get the plain payload object directly, with none of the DOM Event semantics (`stopPropagation`, `.detail` wrapping, `instanceof CustomEvent`) that real GPT listeners never see.

A small in-house emitter (`on`/`off`/`emit` over a typed event map) achieves this directly, with no dependency.

## Considered Options

- Native `EventTarget`/`CustomEvent` — rejected: forces wrapping every payload in a `CustomEvent` and unwrapping via `.detail`, and hands listeners an object that genuinely *is* a `CustomEvent` instance — a runtime shape real GPT never produces, which could surprise a test author who inspects the event object.
- External pub/sub library (e.g. `mitt`) — rejected: the emitter surface needed is a handful of lines; not worth a dependency for it.
