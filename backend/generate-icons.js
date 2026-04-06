/**
 * generate-icons.js
 * Run: node generate-icons.js
 * Requires: npm install sharp
 * Generates all PWA icon sizes from the ARIA/Suzu logo SVG
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT = path.join(__dirname, "../frontend/public/icons");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Suzu logo as SVG string
const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="38%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f0abfc"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </radialGradient>
    <radialGradient id="s" cx="32%" cy="28%" r="40%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="c"><circle cx="256" cy="256" r="200"/></clipPath>
  </defs>
  <rect width="512" height="512" rx="110" fill="#0d0014"/>
  <circle cx="256" cy="256" r="220" fill="rgba(139,92,246,0.2)"/>
  <circle cx="256" cy="256" r="200" fill="url(#g)"/>
  <circle cx="256" cy="256" r="200" fill="url(#s)" clip-path="url(#c)"/>
  <rect x="222" y="168" width="68" height="110" rx="34" fill="white" fill-opacity="0.95"/>
  <path d="M180 278 Q180 340 256 340 Q332 340 332 278" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <line x1="256" y1="340" x2="256" y2="372" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <line x1="220" y1="372" x2="292" y2="372" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <path d="M168 228 Q148 256 168 284" fill="none" stroke="#e9d5ff" stroke-width="8" stroke-linecap="round" stroke-opacity="0.9"/>
  <path d="M344 228 Q364 256 344 284" fill="none" stroke="#e9d5ff" stroke-width="8" stroke-linecap="round" stroke-opacity="0.9"/>
</svg>`;

const svgBuf = Buffer.from(SVG);

(async () => {
    for (const size of SIZES) {
        const outPath = path.join(OUT, `icon-${size}.png`);
        await sharp(svgBuf).resize(size, size).png().toFile(outPath);
        console.log(`✅ Generated: icon-${size}.png`);
    }
    console.log("\n🌸 All icons generated in frontend/public/icons/");
})();