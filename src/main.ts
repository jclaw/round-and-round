import p5 from "p5";
import { createSocket } from "./socket";
import { Scene } from "./Scene";

const SERVER_URL = "http://localhost:3000";

new p5((p) => {
  const socket = createSocket(SERVER_URL);
  const scene = new Scene(p, socket);

  p.setup = () => scene.setup();
  p.draw = () => scene.draw();
  p.mouseDragged = () => scene.mouseDragged();
  p.windowResized = () => scene.windowResized();
});
