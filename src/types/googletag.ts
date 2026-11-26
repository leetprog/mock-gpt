import type { MockNamespace } from '../mock-namespace';
import type { PubAdsService } from '../pubads-service';
import type { SizeMappingBuilder } from '../size-mapping';
import type { Slot } from '../slot';

export type SingleSizeArray = [number, number];
export type FluidSize = 'fluid';
export type NamedSize = FluidSize | [FluidSize];
export type SingleSize = SingleSizeArray | NamedSize;
export type MultiSize = SingleSize[];
export type GeneralSize = SingleSize | MultiSize;
export type SizeMapping = [SingleSizeArray, GeneralSize];
export type SizeMappingArray = SizeMapping[];

export interface ResponseInformation {
  advertiserId: number | null;
  campaignId: number | null;
  creativeId: number | null;
  lineItemId: number | null;
  creativeTemplateId: number | null;
}

/** Matches real GPT's merge-per-key semantics; unknown keys are stored but otherwise inert. */
export interface PageSettingsConfig {
  targeting?: Record<string, string | string[]> | null;
  disableInitialLoad?: boolean;
  [key: string]: unknown;
}

/** Matches real GPT's merge-per-key semantics; unknown keys are stored but otherwise inert. */
export interface SlotSettingsConfig {
  targeting?: Record<string, string | string[]> | null;
  categoryExclusion?: string[] | null;
  adsenseAttributes?: Record<string, string> | null;
  [key: string]: unknown;
}

export interface GptEvent {
  slot: Slot;
  serviceName: string;
}

export type SlotRequestedEvent = GptEvent;
export type SlotResponseReceived = GptEvent;
export type SlotOnloadEvent = GptEvent;
export type ImpressionViewableEvent = GptEvent;

export interface SlotRenderEndedEvent extends GptEvent {
  isEmpty: boolean;
  slotContentChanged: boolean;
  size: number[] | string | null;
  advertiserId: number | null;
  campaignId: number | null;
  creativeId: number | null;
  creativeTemplateId: number | null;
  lineItemId: number | null;
  sourceAgnosticCreativeId: number | null;
  sourceAgnosticLineItemId: number | null;
  isBackfill: boolean;
  yieldGroupIds: number[] | null;
  companyIds: number[] | null;
  responseIdentifier: string | null;
}

export interface EventTypeMap {
  slotRequested: SlotRequestedEvent;
  slotResponseReceived: SlotResponseReceived;
  slotRenderEnded: SlotRenderEndedEvent;
  slotOnload: SlotOnloadEvent;
  impressionViewable: ImpressionViewableEvent;
}

export interface Googletag {
  cmd: Array<() => void>;
  defineSlot(adUnitPath: string, size: GeneralSize, div?: string): Slot | null;
  defineOutOfPageSlot(adUnitPath: string, div?: string): Slot | null;
  pubads(): PubAdsService;
  enableServices(): void;
  display(divOrSlot: string | Element | Slot): void;
  sizeMapping(): SizeMappingBuilder;
  setConfig(config: PageSettingsConfig): void;
  getConfig(keys: string | string[]): Partial<PageSettingsConfig>;
  mock: MockNamespace;
}
