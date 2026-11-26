import type { Googletag } from './types/googletag';

// Placeholder factory — Slot/PubAdsService construction (ADR-0004) not implemented yet.
export function createGoogletagMock(): Googletag {
  return { cmd: [] };
}
