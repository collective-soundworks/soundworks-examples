function circles2(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  const w = width / 100;
  const h = height / 100;

  for (let i = 0; i < 100; i++) {
    for (let j = 0; j < 100; j++) {
      if (i % 2 === 0 && j % 2 === 0) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const a = Math.random();

        const x = i * w;
        const y = j * h;

        const radius = w / 2;

        ctx.beginPath();
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.globalAlpha = a;
        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        ctx.fill();
      }
    }
  }
}