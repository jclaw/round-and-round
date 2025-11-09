import p5 from "p5";
import { io, Socket } from "socket.io-client";

const R = 150;
const START_ANGLE = Math.PI / 2;

interface Orb {
  x: number;
  y: number;
}

new p5((p) => {
  let socketClient: Socket;
  let count = 0;
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
    p.stroke(0);
    p.strokeWeight(4);
    p.noFill();
    p.translate(200, 200);
    p.circle(0, 0, R * 2);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + START_ANGLE;
      const x = R * Math.cos(angle);
      const y = R * Math.sin(angle);


      p.strokeWeight(32);
      p.stroke(200, 100, 100);
      p.point(x, y);
    }
  }

  p.mouseDragged = () => {
    console.log("Mouse dragged at:", p.mouseX, p.mouseY);
    p.fill(0);
    p.circle(p.mouseX, p.mouseY, 20);

    socketClient.emit("mouse", { x: p.mouseX, y: p.mouseY });
  }

  function onUpdateUserCount(data: { count: number }) {
    console.log(`A new user joined. Total users: ${data.count}`);
    if (data.count !== count) {
      count = data.count;
    }
  }


  function onNewMouseData(data: { x: number; y: number }) {
    console.log("Mouse data received:", data);
    p.fill(0);
    p.circle(data.x, data.y, 20);
  }

});
