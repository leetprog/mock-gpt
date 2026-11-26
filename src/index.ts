import { createGoogletagMock } from './create-runtime';
import type { Googletag } from './types/googletag';

declare global {
  var googletag: Googletag | undefined;
}

const queuedFns = Array.isArray(globalThis.googletag?.cmd) ? globalThis.googletag.cmd : [];

const googletag = createGoogletagMock();

globalThis.googletag = googletag;
queuedFns.forEach((fn) => googletag.cmd.push(fn));
