import p5 from "p5";
import { io, Socket } from "socket.io-client";

const CENTER_X = 200;
const CENTER_Y = 200;
const R = 150;
const START_ANGLE = Math.PI / 2;
const ANIM_MS = 450;

interface Orb {
  prevAngle: number;
  angle: number;       // current draw angle (updates each frame during tween)
  targetAngle: number; // where we’re heading
};

new p5((p) => {
  let socketClient: Socket;
  let count = 0;
  const orbs: Orb[] = [];
  let animStart = 0;
  let animActive = false;

  p.setup = () => {
    p.createCanvas(600, 400);


    socketClient = io("http://localhost:3000", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketClient.on("updateUserCount", onUpdateUserCount);

    socketClient.on("connect", () => {
      console.log("Connected to server with ID:", socketClient.id);
    });

    socketClient.on("mouse", onNewMouseData);

    socketClient.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  };

  p.draw = () => {
    p.background(240);

    // ring
    p.push();
    p.translate(CENTER_X, CENTER_Y);
    p.stroke(0);
    p.strokeWeight(4);
    p.noFill();
    p.circle(0, 0, R * 2);

    if (animActive) {
      const t = p.constrain((p.millis() - animStart) / ANIM_MS, 0, 1);
      const u = easeInOutCubic(t);
      for (const orb of orbs) {
        orb.angle = lerpAngle(orb.prevAngle, orb.targetAngle, u);
      }
      if (t >= 1) animActive = false;
    }

    // draw orbs
    for (const orb of orbs) {
      const x = R * Math.cos(orb.angle);
      const y = R * Math.sin(orb.angle);
      p.strokeWeight(32);
      p.stroke(200, 100, 100);
      p.point(x, y);
    }

    p.pop();
  }

  p.mouseDragged = () => {
    console.log("Mouse dragged at:", p.mouseX, p.mouseY);
    p.fill(0);
    p.circle(p.mouseX, p.mouseY, 20);

    socketClient.emit("mouse", { x: p.mouseX, y: p.mouseY });
  }

  function onUpdateUserCount(data: { count: number }) {
    if (data.count === count) return;

    // Snapshot current count and layout
    const oldCount = count;
    count = data.count;

    // Ensure we have the right number of orbs before assigning targets
    resizeOrbs(orbs, oldCount, count);

    // Compute new target layout and kick off tween
    const targets = layoutAngles(count);
    for (let i = 0; i < count; i++) {
      const orb = orbs[i];
      // snapshot current as prev; if newly created orb, prevAngle is already set (see resizeOrbs)
      orb.prevAngle = orb.angle;
      orb.targetAngle = targets[i];
    }
    animStart = p.millis();
    animActive = true;
  }


  function onNewMouseData(data: { x: number; y: number }) {
    console.log("Mouse data received:", data);
    p.fill(0);
    p.circle(data.x, data.y, 20);
  }

});

function resizeOrbs(orbs: Orb[], oldN: number, newN: number) {
  if (newN > oldN) {
    // Adding k new orbs: place them initially at their nearest future slot,
    // or at the last old slot so the shift looks natural.
    const future = layoutAngles(newN);
    for (let i = oldN; i < newN; i++) {
      const startAngle =
        oldN > 0
          ? layoutAngles(oldN)[Math.min(i, oldN - 1)] // start near the tail of old layout
          : future[i]; // first orb starts at its final angle
      orbs[i] = { prevAngle: startAngle, angle: startAngle, targetAngle: future[i] };
    }
  } else if (newN < oldN) {
    // Removing: just truncate; remaining orbs keep their current angles and will tween to new targets
    orbs.length = newN;
  }
}

function layoutAngles(n: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    arr.push((i / n) * Math.PI * 2 + START_ANGLE);
  }
  return arr;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Interpolate angles taking wrap-around into account (shortest arc)
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2; // keep in [-π, π]
  return a + diff * t;
}