export interface OrbLike {
  prevAngle: number;
  angle: number;
  targetAngle: number;
}

export class Orb implements OrbLike {
  prevAngle: number;
  angle: number;
  targetAngle: number;

  constructor(startAngle: number) {
    this.prevAngle = startAngle;
    this.angle = startAngle;
    this.targetAngle = startAngle;
  }
}