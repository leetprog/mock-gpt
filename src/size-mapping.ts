import type { GeneralSize, SingleSizeArray, SizeMappingArray } from './types/googletag';

export class SizeMappingBuilder {
  private mapping: SizeMappingArray = [];

  addSize(viewportSize: SingleSizeArray, slotSize: GeneralSize): this {
    this.mapping.push([viewportSize, slotSize]);
    return this;
  }

  build(): SizeMappingArray {
    return [...this.mapping];
  }
}

/** Evaluates a slot's sizeMapping against the viewport, matching real GPT's own evaluation order (largest viewport entry that fits, first). */
export function getEffectiveSizes(
  requestedSizes: GeneralSize,
  sizeMapping: SizeMappingArray | undefined,
  viewport: { width: number; height: number },
): GeneralSize {
  if (!sizeMapping || sizeMapping.length === 0) return requestedSizes;

  const sorted = [...sizeMapping].sort((a, b) => b[0][0] - a[0][0]);
  const match = sorted.find(
    ([[minWidth, minHeight]]) => viewport.width >= minWidth && viewport.height >= minHeight,
  );
  return match ? match[1] : requestedSizes;
}
