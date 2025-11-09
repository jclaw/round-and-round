import p5 from "p5";
import { io, Socket } from "socket.io-client";

new p5((p) => {
  let socketClient: Socket;
  p.setup = () => {
    p.createCanvas(600, 400);
    p.background(240);

    socketClient = io("http://localhost:3000", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketClient.on("connect", () => {
      console.log("Connected to server with ID:", socketClient.id);
    });

    socketClient.on("mouse", newMouseData);

    socketClient.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  };

  p.mouseDragged = () => {
    console.log("Mouse dragged at:", p.mouseX, p.mouseY);
    p.fill(0);
    p.circle(p.mouseX, p.mouseY, 20);

    socketClient?.emit("mouse", { x: p.mouseX, y: p.mouseY });
  }

  function newMouseData(data: { x: number; y: number }) {
    console.log("Mouse data received:", data);
    p.fill(0);
    p.circle(data.x, data.y, 20);
  }

});
