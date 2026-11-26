# Runtime assembled by a factory, composing classes internally

The public `googletag`-shaped surface (and the `googletag.mock` namespace alongside it) is produced by a single factory function, `createGoogletagMock()`, that both install entry points from **ADR-0002** call identically — the default entry point calls it and installs the result onto the global, the named entry point calls it and just returns the result. There is exactly one implementation behind both entry points.

Internally, that factory composes `Slot` and `PubAdsService` as classes rather than plain closures. Both carry enough identity and lifecycle (slots accumulate over a page's life, get rendered/refreshed; `PubAdsService` tracks listeners and targeting across every slot) that a named class improves readability and debuggability over an anonymous closure-returned object.

The object the factory *returns*, though, is a plain object of bound functions, not `this`-bound methods on a monolithic class. Real app code commonly destructures the API (`const { pubads } = googletag; pubads().setTargeting(...)`), and a monolithic class would break the moment one of its methods is called detached from its instance.

## Considered Options

- Single monolithic class implementing the whole `Googletag` interface directly — rejected: destructuring a method off it and calling it without the instance as `this` would break, which is a realistic usage pattern for both app code and test helpers.
- Closures only, no classes anywhere — rejected: `Slot` and `PubAdsService` have enough internal state and lifecycle to benefit from a named type identity; not worth giving that up repo-wide just to avoid classes in the one place (the returned surface) where binding actually matters.
