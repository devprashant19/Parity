const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="#ef4d23">
  <circle cx="16" cy="16" r="3.5" />
  <circle cx="26.00" cy="16.00" r="3.5" />
  <circle cx="23.07" cy="23.07" r="3.5" />
  <circle cx="16.00" cy="26.00" r="3.5" />
  <circle cx="8.93" cy="23.07" r="3.5" />
  <circle cx="6.00" cy="16.00" r="3.5" />
  <circle cx="8.93" cy="8.93" r="3.5" />
  <circle cx="16.00" cy="6.00" r="3.5" />
  <circle cx="23.07" cy="8.93" r="3.5" />
</svg>`;

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  const appDir = path.resolve(__dirname, '../src/app');

  // 1. Write public/favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent.trim() + '\n', 'utf8');
  console.log('✓ Wrote public/favicon.svg');

  // 2. Write public/logo.svg
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent.trim() + '\n', 'utf8');
  console.log('✓ Wrote public/logo.svg');

  // 3. Write src/app/icon.svg
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent.trim() + '\n', 'utf8');
  console.log('✓ Wrote src/app/icon.svg');

  // 4. Generate 32x32 PNG for favicon
  const png32 = await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
  // Also write as favicon.ico (most browsers accept PNG-encoded ICO or direct fallback)
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32);
  console.log('✓ Generated public/favicon.ico and favicon-32x32.png');

  // 5. Generate 180x180 apple touch icon (on white rounded background for mobile home screens)
  const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" rx="36" fill="#ffffff" />
  <g transform="translate(18, 18) scale(4.5)">
    <circle cx="16" cy="16" r="3.5" fill="#ef4d23" />
    <circle cx="26.00" cy="16.00" r="3.5" fill="#ef4d23" />
    <circle cx="23.07" cy="23.07" r="3.5" fill="#ef4d23" />
    <circle cx="16.00" cy="26.00" r="3.5" fill="#ef4d23" />
    <circle cx="8.93" cy="23.07" r="3.5" fill="#ef4d23" />
    <circle cx="6.00" cy="16.00" r="3.5" fill="#ef4d23" />
    <circle cx="8.93" cy="8.93" r="3.5" fill="#ef4d23" />
    <circle cx="16.00" cy="6.00" r="3.5" fill="#ef4d23" />
    <circle cx="23.07" cy="8.93" r="3.5" fill="#ef4d23" />
  </g>
</svg>`;

  const applePng = await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), applePng);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), applePng);
  console.log('✓ Generated public/apple-touch-icon.png and src/app/apple-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
