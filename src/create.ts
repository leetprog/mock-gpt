import { createGoogletagMock } from './create-runtime';
import type { Googletag } from './types/googletag';

export function createGoogletag(): Googletag {
  return createGoogletagMock();
}
