import type { PubAdsService } from './pubads-service';
import type { GeneralSize, ResponseInformation, SizeMappingArray, SlotSettingsConfig } from './types/googletag';

function mergeTargeting(
  current: Record<string, string | string[]> | null | undefined,
  incoming: Record<string, string | string[] | null>,
): Record<string, string | string[]> {
  const next = { ...(current ?? {}) };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null) delete next[key];
    else next[key] = value;
  }
  return next;
}

export class Slot {
  responseInformation: ResponseInformation | null = null;

  private config: SlotSettingsConfig = {};
  private sizeMapping: SizeMappingArray | undefined;

  constructor(
    private readonly adUnitPath: string,
    private readonly requestedSizes: GeneralSize,
    private readonly divId: string,
  ) {}

  getRequestedSizes(): GeneralSize {
    return this.requestedSizes;
  }

  getSizeMapping(): SizeMappingArray | undefined {
    return this.sizeMapping;
  }

  addService(service: PubAdsService): this {
    service._registerSlot(this);
    return this;
  }

  getAdUnitPath(): string {
    return this.adUnitPath;
  }

  getSlotElementId(): string {
    return this.divId;
  }

  getResponseInformation(): ResponseInformation | null {
    return this.responseInformation;
  }

  defineSizeMapping(sizeMapping: SizeMappingArray): this {
    this.sizeMapping = sizeMapping;
    return this;
  }

  setConfig(partial: SlotSettingsConfig): this {
    for (const [key, value] of Object.entries(partial)) {
      if (key === 'targeting') {
        this.config.targeting =
          value === null ? null : mergeTargeting(this.config.targeting, value as Record<string, string | string[] | null>);
      } else {
        (this.config as Record<string, unknown>)[key] = value;
      }
    }
    return this;
  }

  getConfig(
    keys: string | string[],
  ): Partial<Pick<SlotSettingsConfig, 'targeting' | 'categoryExclusion' | 'adsenseAttributes'>> {
    const requested = Array.isArray(keys) ? keys : [keys];
    const result: Partial<Pick<SlotSettingsConfig, 'targeting' | 'categoryExclusion' | 'adsenseAttributes'>> = {};
    for (const key of requested) {
      if (key === 'targeting' || key === 'categoryExclusion' || key === 'adsenseAttributes') {
        result[key] = this.config[key] as never;
      }
    }
    return result;
  }

  // -- legacy targeting, delegates to this.config.targeting --

  setTargeting(key: string, value: string | string[]): this {
    this.config.targeting = mergeTargeting(this.config.targeting, { [key]: value });
    return this;
  }

  clearTargeting(key?: string): this {
    this.config.targeting = key === undefined ? {} : mergeTargeting(this.config.targeting, { [key]: null });
    return this;
  }

  getTargeting(key: string): string[] {
    const value = this.config.targeting?.[key];
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }

  getTargetingKeys(): string[] {
    return Object.keys(this.config.targeting ?? {});
  }

  _getTargetingSnapshot(): Record<string, string | string[]> {
    return { ...(this.config.targeting ?? {}) };
  }

  updateTargetingFromMap(map: Record<string, string | string[]>): this {
    this.config.targeting = mergeTargeting(this.config.targeting, map);
    return this;
  }

  // -- legacy inert setters/getters; recorded on config, no behavioral effect (ADR-0004 scope decision) --

  setClickUrl(value: string): this {
    this.config.clickUrl = value;
    return this;
  }

  setCategoryExclusion(categoryExclusion: string): this {
    const current = (this.config.categoryExclusion ?? []) as string[];
    this.config.categoryExclusion = [...current, categoryExclusion];
    return this;
  }

  clearCategoryExclusions(): this {
    this.config.categoryExclusion = [];
    return this;
  }

  getCategoryExclusions(): string[] {
    return this.config.categoryExclusion ?? [];
  }

  /** Normalizes onto the same 'DISABLED' | 'BEFORE_FETCH' | 'ON_NO_FILL' | null shape real GPT's config.collapseDiv uses, since setConfig({ collapseDiv }) can set the same field. */
  setCollapseEmptyDiv(collapse: boolean, collapseBeforeAdFetch?: boolean): this {
    this.config.collapseDiv = collapse ? (collapseBeforeAdFetch ? 'BEFORE_FETCH' : 'ON_NO_FILL') : null;
    return this;
  }

  _getCollapseDiv(): 'DISABLED' | 'BEFORE_FETCH' | 'ON_NO_FILL' | null | undefined {
    return this.config.collapseDiv as 'DISABLED' | 'BEFORE_FETCH' | 'ON_NO_FILL' | null | undefined;
  }

  setForceSafeFrame(forceSafeFrame: boolean): this {
    this.config.safeFrame = { ...(this.config.safeFrame as object), forceSafeFrame };
    return this;
  }

  setSafeFrameConfig(config: Record<string, unknown> | null): this {
    this.config.safeFrame = config;
    return this;
  }

  set(key: string, value: string): this {
    const current = (this.config.adsenseAttributes ?? {}) as Record<string, string>;
    this.config.adsenseAttributes = { ...current, [key]: value };
    return this;
  }

  get(key: string): string | null {
    const attrs = this.config.adsenseAttributes as Record<string, string> | undefined;
    return attrs?.[key] ?? null;
  }

  getAttributeKeys(): string[] {
    return Object.keys(this.config.adsenseAttributes ?? {});
  }
}
