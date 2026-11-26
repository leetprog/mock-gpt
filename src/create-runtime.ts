import { MockNamespace } from './mock-namespace';
import { PubAdsService } from './pubads-service';
import { SizeMappingBuilder } from './size-mapping';
import { Slot } from './slot';
import type { GeneralSize, Googletag, PageSettingsConfig } from './types/googletag';

function mergeTargeting(
  current: Record<string, string | string[]>,
  incoming: Record<string, string | string[] | null>,
): Record<string, string | string[]> {
  const next = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null) delete next[key];
    else next[key] = value;
  }
  return next;
}

export function createGoogletagMock(): Googletag {
  const mock = new MockNamespace();

  let pageConfig: PageSettingsConfig = {};

  const pageConfigAccess = {
    getTargeting: () => pageConfig.targeting ?? {},
    mergeTargeting: (partial: Record<string, string | string[] | null>) => {
      pageConfig.targeting = mergeTargeting(pageConfig.targeting ?? {}, partial);
    },
    clearTargeting: (key?: string) => {
      pageConfig.targeting = key === undefined ? {} : mergeTargeting(pageConfig.targeting ?? {}, { [key]: null });
    },
    getDisableInitialLoad: () => pageConfig.disableInitialLoad ?? false,
    setDisableInitialLoad: (value: boolean) => {
      pageConfig.disableInitialLoad = value;
    },
  };

  const definedSlots: Slot[] = [];

  function defineSlot(adUnitPath: string, size: GeneralSize, divId: string): Slot {
    const slot = new Slot(adUnitPath, size, divId);
    definedSlots.push(slot);
    mock.eventLog.append('slotDefined', slot);
    return slot;
  }

  const pubads = new PubAdsService(pageConfigAccess, mock, defineSlot);

  mock.registerReset(() => {
    pubads._reset();
    definedSlots.length = 0;
    pageConfig = {};
  });

  const googletag: Googletag = {
    cmd: [],

    defineSlot(adUnitPath: string, size: GeneralSize, div?: string): Slot | null {
      if (!div) return null;
      return defineSlot(adUnitPath, size, div);
    },

    defineOutOfPageSlot(adUnitPath: string, div?: string): Slot | null {
      if (!div) return null;
      return defineSlot(adUnitPath, [], div);
    },

    pubads(): PubAdsService {
      return pubads;
    },

    enableServices(): void {
      pubads._setEnabled();
    },

    display(divOrSlot: string | Element | Slot): void {
      const divId =
        typeof divOrSlot === 'string'
          ? divOrSlot
          : divOrSlot instanceof Slot
            ? divOrSlot.getSlotElementId()
            : divOrSlot.id;

      const slot = divOrSlot instanceof Slot ? divOrSlot : definedSlots.find((s) => s.getSlotElementId() === divId);
      if (!slot) return;
      if (pageConfig.disableInitialLoad) return;
      pubads.refresh([slot]);
    },

    sizeMapping(): SizeMappingBuilder {
      return new SizeMappingBuilder();
    },

    setConfig(config: PageSettingsConfig): void {
      for (const [key, value] of Object.entries(config)) {
        if (key === 'targeting') {
          pageConfig.targeting =
            value === null
              ? null
              : mergeTargeting(pageConfig.targeting ?? {}, value as Record<string, string | string[] | null>);
        } else {
          (pageConfig as Record<string, unknown>)[key] = value;
        }
      }
    },

    getConfig(keys: string | string[]): Partial<PageSettingsConfig> {
      const requested = Array.isArray(keys) ? keys : [keys];
      const result: Partial<PageSettingsConfig> = {};
      for (const key of requested) {
        (result as Record<string, unknown>)[key] = pageConfig[key];
      }
      return result;
    },

    mock,
  };

  return googletag;
}
