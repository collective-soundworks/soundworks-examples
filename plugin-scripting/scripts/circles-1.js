function circles1(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 5000; i++) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = 200; // Math.floor(Math.random() * 256);
    const color = `rgb(${r}, ${g}, ${b})`;
    const opacity = Math.random() / 3;

    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 2 + Math.random() * 12;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
  }
}
