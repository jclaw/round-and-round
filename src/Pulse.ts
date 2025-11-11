export class Pulse {
  private readonly intervalMs: number;
  private startMs = 0;
  private lastIndex = -1;

  private baseAngle = 0;

  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  reset(nowMs: number, baseAngle = 0): void {
    this.startMs = nowMs;
    this.lastIndex = -1;
    this.baseAngle = baseAngle;
  }

  update(nowMs: number, count: number, onHit: (i: number) => void): void {
    if (count <= 0) return;
    const elapsed = nowMs - this.startMs;
    const idx = Math.floor(elapsed / this.intervalMs) % count;
    if (idx !== this.lastIndex) {
      this.lastIndex = idx;
      onHit(idx);
    }
  }

  /** Angular velocity (rad/ms): one full turn per (count * intervalMs). */
  angularVelocity(count: number): number {
    return count > 0 ? (2 * Math.PI) / (count * this.intervalMs) : 0;
  }

  /** Continuous angle of the pulse head at time `nowMs`. */
  angle(nowMs: number, count: number): number {
    if (count <= 0) return this.baseAngle;
    const elapsed = nowMs - this.startMs;            // ms
    const w = this.angularVelocity(count);           // rad/ms
    const a = this.baseAngle + w * elapsed;
    // Keep it numerically tame:
    const twoPi = Math.PI * 2;
    return a - twoPi * Math.floor(a / twoPi);
  }
}
