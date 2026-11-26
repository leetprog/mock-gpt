# Manual semver + tags for releases, not Changesets

Versioning and publishing are done by hand for now: bump `package.json` via `npm version`, write `CHANGELOG.md` manually, tag and push, `npm publish`. This keeps the release path free of extra tooling and process overhead while the package is early-stage and pre-v1, at the cost of changelog quality depending on someone remembering to write it each time.

Revisit if release cadence or number of contributors increases enough that a manually-maintained changelog becomes unreliable or a bottleneck.

## Considered Options

- Changesets — rejected for now: automates changelog generation and version-bump selection per PR, but is more tooling to configure and learn before there's anything to actually release.
- Leave the release process undecided for now — rejected: it's a lightweight enough decision to settle immediately rather than leave as an open TODO.
