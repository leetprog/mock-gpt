# TypeScript types structurally compatible with @types/google-publisher-tag

The goal is an interface as close to the real GPT library as possible. For TypeScript consumers, the concrete, checkable form of that is: code written against the official `@types/google-publisher-tag` declarations should also type-check against this mock, and vice versa. We chose to build the mock's types to be structurally compatible with that package rather than writing an independent type surface that merely looks similar.

This is an ongoing maintenance coupling, not a one-time choice: whenever Google changes those declarations (new fields, renamed methods, new event payload shapes), the mock's types need to track the change or the "mock and real are interchangeable" promise silently breaks. It also constrains the mock's internal shapes (`Slot`, `PubAdsService`, event payloads, etc.) to GPT's actual declared shapes even where a simpler mock-only shape would be more convenient internally — we don't get to take shortcuts there for our own ergonomics.

## Considered Options

- Independent type surface ("looks similar" but not structurally checked against the official types) — rejected: lower maintenance, but gives no actual guarantee that a test author can swap mock and real imports and have it type-check, which was the point of asking for "as close as possible."
