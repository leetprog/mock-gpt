// Minimal placeholder — the full surface (defineSlot, pubads, enableServices, etc.)
// is designed per the v1 scope in GLOSSARY.md, structurally checked against
// @types/google-publisher-tag per ADR-0003. Not implemented yet.
export interface Googletag {
  cmd: Array<() => void>;
}
