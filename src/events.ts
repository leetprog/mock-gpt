import type { EventTypeMap } from './types/googletag';

type EventMap = EventTypeMap;
type Listener<K extends keyof EventMap> = (event: EventMap[K]) => void;

export class Emitter {
  private listeners = new Map<keyof EventMap, Set<Listener<keyof EventMap>>>();

  on<K extends keyof EventMap>(type: K, listener: Listener<K>): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener as Listener<keyof EventMap>);
    this.listeners.set(type, set);
  }

  off<K extends keyof EventMap>(type: K, listener: Listener<K>): void {
    this.listeners.get(type)?.delete(listener as Listener<keyof EventMap>);
  }

  emit<K extends keyof EventMap>(type: K, event: EventMap[K]): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
