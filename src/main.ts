import p5 from "p5";
import { io, Socket } from "socket.io-client";

let R: number, DEPTH_RANGE: number, DEPTH_MIN: number;
const START_ANGLE = Math.PI / 2;
const ANIM_MS = 450;

const TILT = Math.PI * 0.45;     // 0 = flat, ~0.45π ≈ 81° (strong tilt)
const ORB_SIZE_FRONT = 62;       // size when closest
const ORB_SIZE_BACK = 28;        // size when farthest

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
    p.createCanvas(p.windowWidth, p.windowHeight);
    R = p.windowWidth * 0.4;
    DEPTH_RANGE = 2 * R * Math.sin(TILT);
    DEPTH_MIN = -R * Math.sin(TILT);

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
    p.translate(p.windowWidth / 2, p.windowHeight / 2);
    p.stroke(0);
    p.strokeWeight(4);
    p.noFill();
    // p.circle(0, 0, R * 2);
    p.ellipse(0, 0, R * 2, R * 2 * Math.cos(TILT));

    if (animActive) {
      const t = p.constrain((p.millis() - animStart) / ANIM_MS, 0, 1);
      const u = easeInOutCubic(t);
      for (const orb of orbs) {
        orb.angle = lerpAngle(orb.prevAngle, orb.targetAngle, u);
      }
      if (t >= 1) animActive = false;
    }

    const nodes = orbs.map(o => project(o.angle));
    nodes.sort((a, b) => a.depth - b.depth);

    for (const n of nodes) {
      p.noStroke();
      p.fill(200, 100, 100);
      p.circle(n.x, n.y, n.size);
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

// --- projection of a ring point at angle θ with tilt about X-axis ---
function project(theta: number) {
  const x = R * Math.cos(theta);
  const y = R * Math.sin(theta);

  // rotate around X by TILT: x stays same; y compresses; z becomes depth
  const y2 = y * Math.cos(TILT);
  const z = y * Math.sin(TILT);      // negative = closer to viewer after we flip depth below
  const depth = -z;                   // larger depth => closer

  // normalize depth to [0..1], 0 back → 1 front
  const t = (depth - DEPTH_MIN) / (DEPTH_RANGE || 1);

  // scale + fade by depth
  const size = lerp(ORB_SIZE_FRONT, ORB_SIZE_BACK, t);

  return { x, y: y2, z, depth, t, size };
}

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
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

// scalar lerp
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}