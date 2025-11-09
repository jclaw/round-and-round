import p5 from "p5";
import socket from "socket.io-client";

new p5((p) => {
  p.setup = () => {
    p.createCanvas(600, 400);
    const socketClient = socket("http://localhost:3000", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketClient.on("connect", () => {
      console.log("Connected to server with ID:", socketClient.id);
    });

    socketClient.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  };

  p.draw = () => {
    p.background(240);
    p.fill(0);
    p.circle(p.mouseX, p.mouseY, 20);
  };
});
