import { Emitter } from './events';
import type { MockNamespace } from './mock-namespace';
import { renderIntoDiv, setDivCollapsed } from './render';
import { getEffectiveSizes } from './size-mapping';
import { Slot } from './slot';
import type { EventTypeMap, GeneralSize, SlotRenderEndedEvent } from './types/googletag';

export interface PageConfigAccess {
  getTargeting(): Record<string, string | string[]>;
  mergeTargeting(partial: Record<string, string | string[] | null>): void;
  clearTargeting(key?: string): void;
  getDisableInitialLoad(): boolean;
  setDisableInitialLoad(value: boolean): void;
}

type SimpleEventType = 'slotRequested' | 'slotResponseReceived' | 'slotOnload' | 'impressionViewable';

export class PubAdsService {
  private slots: Slot[] = [];
  private readonly emitter = new Emitter();
  private enabled = false;
  private singleRequestMode = false;
  private serviceCollapseMode: 'BEFORE_FETCH' | 'ON_NO_FILL' | null = null;

  // -- legacy inert fields; no setConfig/getConfig exists on the real service, so these are plain fields --
  private categoryExclusions: string[] = [];
  private adsenseAttributes: Record<string, string> = {};

  constructor(
    private readonly pageConfig: PageConfigAccess,
    private readonly mock: MockNamespace,
    private readonly defineSlotFn: (adUnitPath: string, size: GeneralSize, divId: string) => Slot,
  ) {}

  _registerSlot(slot: Slot): void {
    if (!this.slots.includes(slot)) this.slots.push(slot);
  }

  getSlots(): Slot[] {
    return [...this.slots];
  }

  _reset(): void {
    this.slots = [];
    this.enabled = false;
    this.singleRequestMode = false;
    this.serviceCollapseMode = null;
    this.categoryExclusions = [];
    this.adsenseAttributes = {};
  }

  /** Called by googletag.enableServices() — gates enableSingleRequest/collapseEmptyDivs exactly like real GPT. */
  _setEnabled(): void {
    this.enabled = true;
  }

  // -- events --

  addEventListener<K extends keyof EventTypeMap>(
    type: K,
    listener: (event: EventTypeMap[K]) => void,
  ): this {
    this.emitter.on(type, listener);
    return this;
  }

  removeEventListener<K extends keyof EventTypeMap>(
    type: K,
    listener: (event: EventTypeMap[K]) => void,
  ): void {
    this.emitter.off(type, listener);
  }

  private emitSimple(type: SimpleEventType, slot: Slot): void {
    const event = { slot, serviceName: 'publisher_ads' } as EventTypeMap[SimpleEventType];
    this.emitter.emit(type, event);
    this.mock.eventLog.append(type, slot);
  }

  private emitRenderEnded(slot: Slot, fields: Omit<SlotRenderEndedEvent, 'slot' | 'serviceName'>): void {
    this.emitter.emit('slotRenderEnded', { slot, serviceName: 'publisher_ads', ...fields });
    this.mock.eventLog.append('slotRenderEnded', slot);
  }

  // -- the real behavior --

  refresh(targetSlots?: Slot[] | null, _options?: { changeCorrelator: boolean }): void {
    for (const slot of targetSlots ?? this.slots) {
      void this.requestAd(slot);
    }
  }

  private async requestAd(slot: Slot): Promise<void> {
    await Promise.resolve(); // ADR-0006: never dispatch purely synchronously, even the first event

    const collapseMode = slot._getCollapseDiv() ?? this.serviceCollapseMode;
    if (collapseMode === 'BEFORE_FETCH') setDivCollapsed(slot.getSlotElementId(), true);

    this.emitSimple('slotRequested', slot);

    const effectiveSizes = getEffectiveSizes(slot.getRequestedSizes(), slot.getSizeMapping(), this.mock.viewport.get());
    const targeting = { ...this.pageConfig.getTargeting(), ...slot._getTargetingSnapshot() };

    const resolved = await this.mock.resolveCreative(slot.getAdUnitPath(), {
      requestedSizes: slot.getRequestedSizes(),
      effectiveSizes,
      targeting,
    });

    this.emitSimple('slotResponseReceived', slot);

    if ('isEmpty' in resolved) {
      slot.responseInformation = null;
      if (collapseMode === 'BEFORE_FETCH' || collapseMode === 'ON_NO_FILL') {
        setDivCollapsed(slot.getSlotElementId(), true);
      }
      this.emitRenderEnded(slot, {
        isEmpty: true,
        slotContentChanged: true,
        size: null,
        advertiserId: null,
        campaignId: null,
        creativeId: null,
        creativeTemplateId: null,
        lineItemId: null,
        sourceAgnosticCreativeId: null,
        sourceAgnosticLineItemId: null,
        isBackfill: false,
        yieldGroupIds: null,
        companyIds: null,
        responseIdentifier: null,
      });
    } else {
      if (collapseMode === 'BEFORE_FETCH') setDivCollapsed(slot.getSlotElementId(), false);
      renderIntoDiv(slot.getSlotElementId(), resolved.html);
      slot.responseInformation = {
        advertiserId: null,
        campaignId: null,
        creativeId: null,
        lineItemId: null,
        creativeTemplateId: null,
      };
      this.emitRenderEnded(slot, {
        isEmpty: false,
        slotContentChanged: true,
        size: resolved.size,
        advertiserId: null,
        campaignId: null,
        creativeId: null,
        creativeTemplateId: null,
        lineItemId: null,
        sourceAgnosticCreativeId: null,
        sourceAgnosticLineItemId: null,
        isBackfill: false,
        yieldGroupIds: null,
        companyIds: null,
        responseIdentifier: null,
      });
    }

    this.emitSimple('slotOnload', slot);
    await this.mock.resolveViewability(slot);
    this.emitSimple('impressionViewable', slot);
  }

  clear(targetSlots?: Slot[]): boolean {
    for (const slot of targetSlots ?? this.slots) {
      slot.responseInformation = null;
      const el = document.getElementById(slot.getSlotElementId());
      if (el) el.innerHTML = '';
    }
    return true;
  }

  display(adUnitPath: string, size: GeneralSize, div?: string | Element, _clickUrl?: string): void {
    const divId = typeof div === 'string' ? div : (div?.id ?? '');
    const slot = this.defineSlotFn(adUnitPath, size, divId);
    slot.addService(this);
    this.refresh([slot]);
  }

  // -- targeting, delegates to the SHARED page config store --

  setTargeting(key: string, value: string | string[]): this {
    this.pageConfig.mergeTargeting({ [key]: value });
    return this;
  }

  clearTargeting(key?: string): this {
    this.pageConfig.clearTargeting(key);
    return this;
  }

  getTargeting(key: string): string[] {
    const value = this.pageConfig.getTargeting()[key];
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }

  getTargetingKeys(): string[] {
    return Object.keys(this.pageConfig.getTargeting());
  }

  // -- disableInitialLoad, also delegates to the shared page config store --

  disableInitialLoad(): void {
    this.pageConfig.setDisableInitialLoad(true);
  }

  isInitialLoadDisabled(): boolean {
    return this.pageConfig.getDisableInitialLoad();
  }

  // -- legacy inert methods; own fields, no behavioral effect (ADR-0004 scope decision) --

  setCentering(_centerAds: boolean): void {}

  /** Real GPT: must be called before the service is enabled, or it fails. */
  enableSingleRequest(): boolean {
    if (this.enabled) return false;
    this.singleRequestMode = true;
    return true;
  }

  setCategoryExclusion(categoryExclusion: string): this {
    this.categoryExclusions.push(categoryExclusion);
    return this;
  }

  clearCategoryExclusions(): this {
    this.categoryExclusions = [];
    return this;
  }

  /** Real GPT: must be called before the service is enabled, or it fails. Slot-level setCollapseEmptyDiv/setConfig overrides this per slot. */
  collapseEmptyDivs(collapseBeforeAdFetch?: boolean): boolean {
    if (this.enabled) return false;
    this.serviceCollapseMode = collapseBeforeAdFetch ? 'BEFORE_FETCH' : 'ON_NO_FILL';
    return true;
  }

  setLocation(_address: string): this {
    return this;
  }

  setPublisherProvidedId(_ppid: string): this {
    return this;
  }

  setPrivacySettings(_settings: Record<string, unknown>): this {
    return this;
  }

  setForceSafeFrame(_forceSafeFrame: boolean): this {
    return this;
  }

  setSafeFrameConfig(_config: Record<string, unknown> | null): this {
    return this;
  }

  enableLazyLoad(_config?: Record<string, unknown>): void {}

  enableVideoAds(): void {}

  setVideoContent(_videoContentId: string, _videoCmsId: string): void {}

  set(key: string, value: string): this {
    this.adsenseAttributes[key] = value;
    return this;
  }

  get(key: string): string | null {
    return this.adsenseAttributes[key] ?? null;
  }

  getAttributeKeys(): string[] {
    return Object.keys(this.adsenseAttributes);
  }

  updateCorrelator(): this {
    return this;
  }

  registerRequestHook(_hook: (...args: unknown[]) => Promise<void>, _hookId: string): () => void {
    return () => {};
  }
}
