export function drawJunkzBrand(ctx, edition) {
  const background = ctx.createLinearGradient(0, 0, 1024, 1368);
  background.addColorStop(0, "#080b20");
  background.addColorStop(1, "#180a30");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1024, 1368);
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = i % 2 ? "#04dbff35" : "#fb32e535";
    ctx.beginPath();
    ctx.arc(190 + (i * 193) % 740, 240 + (i * 317) % 750, 1 + i % 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(565, 500);
  ctx.rotate(-0.12);
  ctx.transform(1, 0, -0.13, 1, 0, 0);
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  const paintWord = (word, y, size) => {
    ctx.font = "900 italic " + size + "px Impact, Arial Black, sans-serif";
    ctx.lineWidth = 38;
    ctx.strokeStyle = "#020312";
    ctx.strokeText(word, 10, y + 14);
    ctx.lineWidth = 23;
    ctx.strokeStyle = "#e82cd7";
    ctx.strokeText(word, 8, y + 9);
    ctx.lineWidth = 11;
    ctx.strokeStyle = "#15dbff";
    ctx.strokeText(word, 0, y);
    const fill = ctx.createLinearGradient(0, y - size, 0, y + 20);
    fill.addColorStop(0, "#ffffff");
    fill.addColorStop(0.55, "#ebfbff");
    fill.addColorStop(1, "#538fc3");
    ctx.fillStyle = fill;
    ctx.fillText(word, 0, y);
  };
  paintWord("SPACE", -30, 145);
  paintWord("JUNKZ", 165, 190);
  ctx.restore();
  ctx.strokeStyle = "#14dfff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(260, 755);
  ctx.lineTo(865, 700);
  ctx.stroke();
  ctx.fillStyle = "#f23dde";
  for (const [x, height] of [[310, 60], [346, 95], [805, 45]]) ctx.fillRect(x, 748, 6, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#d2c6ff";
  ctx.font = "bold 27px Arial, sans-serif";
  ctx.fillText(edition, 565, 865);
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText("WIZZ LAB STUDIOS", 565, 1260);
}
