function squares(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  const w = width / 100;
  const h = height / 100;

  for (let i = 0; i < 100; i++) {
    for (let j = 0; j < 100; j++) {
      if (
        (i % 2 === 0 && j % 2 === 0)
        || (i % 2 === 1 && j % 2 === 1)
      ) {
        const x = i * w;
        const y = j * h;

        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
      }
    }
  }
}