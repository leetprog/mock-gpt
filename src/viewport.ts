export class ViewportSource {
  private override: { width: number; height: number } | null = null;

  setDimensions(width: number, height: number): void {
    this.override = { width, height };
  }

  get(): { width: number; height: number } {
    if (this.override) return this.override;
    return { width: window.innerWidth, height: window.innerHeight };
  }

  reset(): void {
    this.override = null;
  }
}
