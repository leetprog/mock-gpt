import { beforeEach, describe, expect, it } from 'vitest';
import { createGoogletagMock } from './create-runtime';

function makeDiv(id: string): void {
  const div = document.createElement('div');
  div.id = id;
  document.body.appendChild(div);
}

function waitFor<T>(googletag: ReturnType<typeof createGoogletagMock>, eventType: 'impressionViewable'): Promise<T> {
  return new Promise((resolve) => {
    googletag.pubads().addEventListener(eventType, (event) => resolve(event as T));
  });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('golden path', () => {
  it('fires the full event lifecycle in order and renders the creative', async () => {
    makeDiv('div-1');
    const googletag = createGoogletagMock();
    const order: string[] = [];
    const pubads = googletag.pubads();

    for (const type of ['slotRequested', 'slotResponseReceived', 'slotRenderEnded', 'slotOnload', 'impressionViewable'] as const) {
      pubads.addEventListener(type, () => order.push(type));
    }

    const slot = googletag.defineSlot('/1234/test', [300, 250], 'div-1')!;
    slot.addService(pubads);
    googletag.enableServices();
    googletag.display('div-1');

    await waitFor(googletag, 'impressionViewable');

    expect(order).toEqual(['slotRequested', 'slotResponseReceived', 'slotRenderEnded', 'slotOnload', 'impressionViewable']);

    const iframe = document.getElementById('div-1')!.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.srcdoc).toContain('/1234/test');
  });

  it('logs slot definition and every dispatched event in googletag.mock.events', async () => {
    makeDiv('div-2');
    const googletag = createGoogletagMock();
    const slot = googletag.defineSlot('/1234/log', [300, 250], 'div-2')!;
    slot.addService(googletag.pubads());
    googletag.enableServices();
    googletag.display('div-2');

    await waitFor(googletag, 'impressionViewable');

    const types = googletag.mock.events.map((entry) => entry.type);
    expect(types).toEqual([
      'slotDefined',
      'slotRequested',
      'slotResponseReceived',
      'slotRenderEnded',
      'slotOnload',
      'impressionViewable',
    ]);
  });
});

describe('no compatible sizes', () => {
  it('distinguishes no-compatible-size from a generic no-fill', async () => {
    makeDiv('div-3');
    const googletag = createGoogletagMock();
    const pubads = googletag.pubads();
    let renderEnded: { isEmpty: boolean; size: unknown } | undefined;
    pubads.addEventListener('slotRenderEnded', (event) => {
      renderEnded = event;
    });

    const slot = googletag.defineSlot('/1234/fluid', 'fluid', 'div-3')!;
    slot.addService(pubads);
    googletag.enableServices();
    googletag.display('div-3');

    await waitFor(googletag, 'impressionViewable');

    expect(renderEnded?.isEmpty).toBe(true);
    expect(renderEnded?.size).toBeNull();
  });
});

describe('collapseEmptyDivs', () => {
  it('collapses the div on no-fill when ON_NO_FILL is set', async () => {
    makeDiv('div-4');
    const googletag = createGoogletagMock();
    const pubads = googletag.pubads();
    pubads.collapseEmptyDivs(); // ON_NO_FILL mode

    const slot = googletag.defineSlot('/1234/collapse', 'fluid', 'div-4')!; // no compatible size -> no-fill
    slot.addService(pubads);
    googletag.enableServices();
    googletag.display('div-4');

    await waitFor(googletag, 'impressionViewable');

    expect(document.getElementById('div-4')!.style.display).toBe('none');
  });

  it('fails to enable after the service is already enabled', () => {
    const googletag = createGoogletagMock();
    const pubads = googletag.pubads();
    googletag.enableServices();

    expect(pubads.collapseEmptyDivs()).toBe(false);
    expect(pubads.enableSingleRequest()).toBe(false);
  });
});

describe('custom creative resolver', () => {
  it('overrides the default placeholder', async () => {
    makeDiv('div-5');
    const googletag = createGoogletagMock();
    googletag.mock.setCreativeResolver(async () => ({ html: '<p>custom</p>', size: [300, 250] }));

    const pubads = googletag.pubads();
    const slot = googletag.defineSlot('/1234/custom', [300, 250], 'div-5')!;
    slot.addService(pubads);
    googletag.enableServices();
    googletag.display('div-5');

    await waitFor(googletag, 'impressionViewable');

    const iframe = document.getElementById('div-5')!.querySelector('iframe');
    expect(iframe!.srcdoc).toBe('<p>custom</p>');
  });
});

describe('reset', () => {
  it('clears slots and the event log', async () => {
    makeDiv('div-6');
    const googletag = createGoogletagMock();
    const pubads = googletag.pubads();
    const slot = googletag.defineSlot('/1234/reset', [300, 250], 'div-6')!;
    slot.addService(pubads);
    googletag.enableServices();
    googletag.display('div-6');
    await waitFor(googletag, 'impressionViewable');

    googletag.mock.reset();

    expect(googletag.pubads().getSlots()).toEqual([]);
    expect(googletag.mock.events).toEqual([]);
  });
});
