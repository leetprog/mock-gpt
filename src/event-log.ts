import type { Slot } from './slot';

export interface EventLogEntry {
  type: string;
  slot: Slot | null;
  timestamp: number;
}

export class EventLog {
  private entries: EventLogEntry[] = [];

  append(type: string, slot: Slot | null): void {
    this.entries.push({ type, slot, timestamp: Date.now() });
  }

  get all(): readonly EventLogEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }
}
