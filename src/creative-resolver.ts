import type { GeneralSize, SingleSizeArray } from './types/googletag';

export interface ResolverContext {
  requestedSizes: GeneralSize;
  effectiveSizes: GeneralSize;
  targeting: Record<string, string | string[]>;
}

export type ResolvedCreative =
  | { html: string; size: SingleSizeArray }
  // `noCompatibleSizes` distinguishes "this viewport's effective sizes had nothing
  // concrete to render" from a generic no-fill — both are normal outcomes, not errors.
  | { isEmpty: true; noCompatibleSizes?: boolean };

export type CreativeResolver = (adUnitPath: string, context: ResolverContext) => Promise<ResolvedCreative>;

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function concreteSizes(sizes: GeneralSize): SingleSizeArray[] {
  const list = Array.isArray(sizes[0]) ? (sizes as SingleSizeArray[]) : [sizes as SingleSizeArray];
  return list.filter((size): size is SingleSizeArray => typeof size[0] === 'number');
}

/** Pulls its delay live from the mock namespace each call, so changing the setting mid-test takes effect immediately. */
export function createDefaultCreativeResolver(mock: { creativeResolverDelayMs: number }): CreativeResolver {
  return async (adUnitPath, context) => {
    await delay(mock.creativeResolverDelayMs);

    const matches = concreteSizes(context.effectiveSizes);
    if (matches.length === 0) return { isEmpty: true, noCompatibleSizes: true };

    const size = matches[0];
    return {
      html: `<div data-mock-gpt-placeholder="true">mock-gpt: ${adUnitPath} (${size[0]}x${size[1]})</div>`,
      size,
    };
  };
}
