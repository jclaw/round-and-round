import { START_ANGLE } from "./constants";
import p5 from "p5";
import { Socket } from "socket.io-client";
import { Orb } from "./Orb";
import { Pulse } from "./Pulse";
import { easeInOutCubic, lerpAngle } from "./math/easing";
import { layoutAngles } from "./math/layout";
import { Projector } from "./Projector";
import type { CountMessage, MouseMessage } from "./socket";

/**
 * Owns all runtime state (p5, socket, orbs, animation) and draws the scene.
 */
export class Scene {
  private p: p5;
  private socket: Socket;

  private count = 0;
  private orbs: Orb[] = [];
  private pulse = new Pulse(500);
  private static readonly TRAIL_MS = 1500;
  private static readonly TRAIL_SEGMENTS = 80;

  private animStart = 0;
  private animActive = false;

  private projector = new Projector();

  constructor(p: p5, socket: Socket) {
    this.p = p;
    this.socket = socket;
  }

  setup(): void {
    this.p.createCanvas(this.p.windowWidth, this.p.windowHeight);
    this.updateRadius();

    // Socket events
    this.socket.on("updateUserCount", (data: CountMessage) => {
      this.onUpdateUserCount(data)
    });
    this.socket.on("mouse", (data: MouseMessage) => this.onNewMouseData(data));

    this.socket.on("connect", () => {
      console.log("Connected to server with ID:", this.socket.id);
    });
    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }

  draw(): void {
    const p = this.p;
    p.background(240);

    p.push();
    p.translate(p.windowWidth / 2, p.windowHeight / 2);

    // ring
    p.stroke(0);
    p.strokeWeight(4);
    p.noFill();
    p.ellipse(0, 0, this.projector.R * 2, this.projector.ellipseHeight());

    // tween
    if (this.animActive) {
      const t = p.constrain((p.millis() - this.animStart) / 450, 0, 1);
      const u = easeInOutCubic(t);
      for (const orb of this.orbs) {
        orb.angle = lerpAngle(orb.prevAngle, orb.targetAngle, u);
      }
      if (t >= 1) this.animActive = false;
    }

    // drive the pulse
    this.pulse.update(p.millis(), this.count, (i) => {
      const orb = this.orbs[i];
      if (orb) orb.activate(p.millis());
    });

    this.drawPulseTrail();

    // depth sort + draw
    const nodes = this.orbs.map((o, i) => ({ i, node: this.projector.project(o.angle) }));
    nodes.sort((a, b) => a.node.depth - b.node.depth);

    for (const { i, node } of nodes) {
      const glow = this.orbs[i]?.activationStrength(p.millis()) ?? 0; // 0..1
      const size = node.size * (1 + 0.35 * glow); // pulse scale
      p.noStroke();
      p.fill(200, 100 + 80 * glow, 100);
      p.circle(node.x, node.y, size);
    }

    p.pop();
  }

  mouseDragged(): void {
    const p = this.p;
    p.fill(0);
    p.circle(p.mouseX, p.mouseY, 20);
    this.socket.emit("mouse", { x: p.mouseX, y: p.mouseY });
  }

  windowResized(): void {
    this.p.resizeCanvas(this.p.windowWidth, this.p.windowHeight);
    this.updateRadius();
  }

  // ——— Internals ———

  private updateRadius(): void {
    // Match your previous behavior (40% of window width)
    const r = this.p.windowWidth * 0.4;
    this.projector.setRadius(r);
  }

  private onUpdateUserCount(data: CountMessage): void {
    if (data.count === this.count) return;

    const oldCount = this.count;
    this.count = data.count;

    this.resizeOrbs(oldCount, this.count);

    const targets = layoutAngles(this.count);
    for (let i = 0; i < this.count; i++) {
      const orb = this.orbs[i];
      if (!orb || !targets[i]) continue;
      orb.prevAngle = orb.angle;
      orb.targetAngle = targets[i];
    }
    this.animStart = this.p.millis();
    this.animActive = true;
    this.pulse.reset(this.p.millis(), START_ANGLE);
  }

  private drawPulseTrail(): void {
    const p = this.p;
    if (this.count <= 0) return;

    const now = p.millis();
    const headA = this.pulse.angle(now, this.count);           // head angle
    const w = this.pulse.angularVelocity(this.count);          // rad/ms
    const trailSpan = Math.max(0, w * Scene.TRAIL_MS);         // radians behind head
    const segs = Scene.TRAIL_SEGMENTS;

    // Sample along the trail from tail -> head so alpha increases as we approach head
    let prev = this.projector.project(headA - trailSpan);
    p.push();
    p.noFill();
    p.strokeWeight(3);

    for (let s = 1; s <= segs; s++) {
      const t = s / segs; // 0..1
      const a = headA - trailSpan * (1 - t);
      const cur = this.projector.project(a);

      // Fade from faint to strong near the head
      const alpha = 40 + Math.floor(160 * t); // 40..200
      p.stroke(200, 100, 100, alpha);

      // Draw a small segment
      p.line(prev.x, prev.y, cur.x, cur.y);
      prev = cur;
    }

    // Draw the pulse head indicator (tiny bright dot)
    const head = this.projector.project(headA);
    p.noStroke();
    p.fill(220, 60, 60);
    p.circle(head.x, head.y, 10);

    p.pop();
  }


  private onNewMouseData(data: MouseMessage): void {
    const p = this.p;
    p.fill(0);
    p.circle(data.x, data.y, 20);
  }

  private resizeOrbs(oldN: number, newN: number): void {
    if (newN > oldN) {
      const future = layoutAngles(newN);
      const oldLayout = oldN > 0 ? layoutAngles(oldN) : [];

      for (let i = oldN; i < newN; i++) {
        const startAngle =
          oldN > 0 ? oldLayout[Math.min(i, oldN - 1)] : future[i];
        if (!startAngle) continue;
        this.orbs[i] = new Orb(startAngle);
      }
    } else if (newN < oldN) {
      this.orbs.length = newN;
    }
  }
}
