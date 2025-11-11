import p5 from "p5";
import { Socket } from "socket.io-client";
import { Orb } from "./Orb";
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
    this.socket.on("updateUserCount", (data: CountMessage) =>
      this.onUpdateUserCount(data)
    );
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

    // depth sort + draw
    const nodes = this.orbs.map((o) => this.projector.project(o.angle));
    nodes.sort((a, b) => a.depth - b.depth);

    for (const n of nodes) {
      p.noStroke();
      p.fill(200, 100, 100);
      p.circle(n.x, n.y, n.size);
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
