// Render the favicons and Apple touch icons from the logo sources in public/brand.
// Run from the repo root: node scripts/apple-touch-icons.mjs
// iOS masks touch icons to its own rounded shape, so their source is a full-bleed square with no transparency.
import sharp from 'sharp'

const touch = 'public/brand/apple-touch-icon.svg'
for (const size of [180, 167, 152, 120]) {
  const out = size === 180 ? 'public/apple-touch-icon.png' : `public/icons/apple-touch-icon-${size}.png`
  await sharp(touch, { density: 300 }).resize(size, size).flatten({ background: '#2d5f46' }).png().toFile(out)
  console.log(out)
}

// Favicons keep the rounded-square mark on a transparent background.
for (const size of [32, 192]) {
  const out = `public/icons/icon-${size}.png`
  await sharp('public/brand/mark.svg', { density: 600 }).resize(size, size).png().toFile(out)
  console.log(out)
}
