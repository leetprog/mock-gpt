import { createDefaultCreativeResolver } from './creative-resolver';
import type { CreativeResolver, ResolvedCreative, ResolverContext } from './creative-resolver';
import { EventLog } from './event-log';
import type { Slot } from './slot';
import { ViewportSource } from './viewport';

export type ViewabilityResolver = (slot: Slot) => Promise<void>;

const defaultViewabilityResolver: ViewabilityResolver = () => Promise.resolve();

export class MockNamespace {
  creativeResolverDelayMs = 0;
  readonly viewport = new ViewportSource();
  readonly eventLog = new EventLog();

  private creativeResolverOverride: CreativeResolver | null = null;
  private viewabilityResolverOverride: ViewabilityResolver | null = null;
  private readonly defaultCreativeResolver = createDefaultCreativeResolver(this);
  private readonly resetCallbacks: Array<() => void> = [];

  /** Lets create-runtime.ts hook in cleanup it owns (slot roster, page config) without MockNamespace knowing about those. */
  registerReset(callback: () => void): void {
    this.resetCallbacks.push(callback);
  }

  get events(): readonly { type: string; slot: Slot | null; timestamp: number }[] {
    return this.eventLog.all;
  }

  setCreativeResolver(resolver: CreativeResolver): void {
    this.creativeResolverOverride = resolver;
  }

  setViewabilityResolver(resolver: ViewabilityResolver): void {
    this.viewabilityResolverOverride = resolver;
  }

  setViewportDimensions(width: number, height: number): void {
    this.viewport.setDimensions(width, height);
  }

  resolveCreative(adUnitPath: string, context: ResolverContext): Promise<ResolvedCreative> {
    return (this.creativeResolverOverride ?? this.defaultCreativeResolver)(adUnitPath, context);
  }

  resolveViewability(slot: Slot): Promise<void> {
    return (this.viewabilityResolverOverride ?? defaultViewabilityResolver)(slot);
  }

  reset(): void {
    this.creativeResolverOverride = null;
    this.viewabilityResolverOverride = null;
    this.creativeResolverDelayMs = 0;
    this.viewport.reset();
    this.eventLog.clear();
    for (const callback of this.resetCallbacks) callback();
  }
}
