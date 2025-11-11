import { ORB_SIZE_BACK, ORB_SIZE_FRONT, TILT } from "./constants";
import { lerp } from "./math";

export interface ProjectedNode {
  x: number;
  y: number;
  z: number;
  depth: number; // larger => closer
  t: number;     // normalized depth 0..1 (back..front)
  size: number;
}

/**
 * Handles ring geometry + depth projection for the tilted ellipse.
 */
export class Projector {
  private _R = 200; // default; set in setup/resize

  setRadius(r: number): void {
    this._R = Math.max(1, r);
  }

  get R(): number {
    return this._R;
  }

  ellipseHeight(): number {
    return this._R * 2 * Math.cos(TILT);
  }

  project(theta: number): ProjectedNode {
    const x = this._R * Math.cos(theta);
    const y = this._R * Math.sin(theta);

    // rotate around X by TILT: x stays same; y compresses; z becomes depth
    const y2 = y * Math.cos(TILT);
    const z = y * Math.sin(TILT);    // negative is closer before flip
    const depth = z;                // larger => closer

    // Normalize to [0..1] (0 back → 1 front)
    const depthRange = 2 * this._R * Math.sin(TILT);
    const depthMin = -this._R * Math.sin(TILT);
    const t = (depth - depthMin) / Math.max(1, depthRange);

    // Scale by depth
    const size = lerp(ORB_SIZE_BACK, ORB_SIZE_FRONT, t);

    return { x, y: y2, z, depth, t, size };
  }
}
