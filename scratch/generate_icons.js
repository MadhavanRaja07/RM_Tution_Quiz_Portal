const fs = require('fs');
const path = require('path');

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="110" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4F46E5"/>
      <stop offset="0.5" stop-color="#7C3AED"/>
      <stop offset="1" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
  <path d="M256 120L360 180V300L256 360L152 300V180L256 120Z" stroke="white" stroke-width="20" stroke-linejoin="round" fill="none"/>
  <circle cx="256" cy="240" r="32" fill="white"/>
  <path d="M160 380H352" stroke="white" stroke-width="16" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Generated public/icons/icon.svg');

// Check if sharp is available to convert SVG to PNG
try {
  const sharp = require('sharp');
  sharp(path.join(iconsDir, 'icon.svg'))
    .resize(192, 192)
    .toFile(path.join(iconsDir, 'icon-192.png'));
  sharp(path.join(iconsDir, 'icon.svg'))
    .resize(512, 512)
    .toFile(path.join(iconsDir, 'icon-512.png'));
  sharp(path.join(iconsDir, 'icon.svg'))
    .resize(180, 180)
    .toFile(path.join(iconsDir, 'apple-icon.png'));
  console.log('Generated PNG icons with sharp');
} catch (e) {
  console.log('Sharp not available, copying SVG file');
  fs.copyFileSync(path.join(iconsDir, 'icon.svg'), path.join(iconsDir, 'icon-192.png'));
  fs.copyFileSync(path.join(iconsDir, 'icon.svg'), path.join(iconsDir, 'icon-512.png'));
  fs.copyFileSync(path.join(iconsDir, 'icon.svg'), path.join(iconsDir, 'apple-icon.png'));
}
