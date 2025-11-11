export interface OrbLike {
  prevAngle: number;
  angle: number;
  targetAngle: number;
}

export class Orb implements OrbLike {
  prevAngle: number;
  angle: number;
  targetAngle: number;

  private activatedAt = -1;

  constructor(startAngle: number) {
    this.prevAngle = startAngle;
    this.angle = startAngle;
    this.targetAngle = startAngle;
  }

  activate(nowMs: number): void {
    this.activatedAt = nowMs;
  }

  /**
   * Returns 0..1, decaying to 0 over ~300ms after activation.
   */
  activationStrength(nowMs: number): number {
    if (this.activatedAt < 0) return 0;
    const d = nowMs - this.activatedAt;
    const DURATION = 300;
    if (d >= DURATION) return 0;
    const t = 1 - d / DURATION;
    return t * t; // ease-out
  }
}
