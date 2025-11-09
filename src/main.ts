import p5 from "p5";

new p5((p) => {
  p.setup = () => {
    p.createCanvas(600, 400);
  };

  p.draw = () => {
    p.background(240);
    p.fill(0);
    p.circle(p.mouseX, p.mouseY, 20);
  };
});
