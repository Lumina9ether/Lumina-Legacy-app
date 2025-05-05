const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
const count = 200;

for (let i = 0; i < count; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5,
    alpha: Math.random()
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fill();
  });
  twinkle();
  requestAnimationFrame(draw);
}

function twinkle() {
  stars.forEach(star => {
    star.alpha += (Math.random() - 0.5) * 0.05;
    star.alpha = Math.max(0, Math.min(1, star.alpha));
  });
}

draw();
