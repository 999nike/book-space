export function drawWizzBrand(ctx, image, name) {
  const background = ctx.createLinearGradient(0, 0, 1024, 1368);
  background.addColorStop(0, "#090d20");
  background.addColorStop(1, "#21103d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1024, 1368);
  // Use the supplied WIZZ artwork itself, rather than recreating its lettering.
  const scale = Math.min(824 / image.naturalWidth, 460 / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, 160 + (824 - width) / 2, 390 + (460 - height) / 2, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e8f8ff";
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText(name, 572, 970, 780);
}
