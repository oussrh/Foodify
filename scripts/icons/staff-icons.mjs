// scripts/icons/staff-icons.mjs
// Draws the Foodizar staff apps' icons and iOS startup images from lib/staff-apps.ts (names,
// colours, files, screens) and lib/staff-mark.ts (the mark), so the pictures and the manifest that
// names them can never disagree. Writes the SVG sources to scripts/icons/svg/ and the PNGs to
// public/icons/staff/; both are committed, and this is run again only when the mark, a name or the
// list of screens changes:
//
//   node --experimental-strip-types scripts/icons/staff-icons.mjs   (Node 22.6+; no flag from 22.18)
//
// sharp renders the SVG. It is not a dependency of ours but of Next's (its image optimiser), so it
// is resolved from where Next is installed rather than added to package.json for a script run by
// hand. Text on the startup images is set in the system's sans-serif (librsvg cannot reach the
// app's web font), which is why the words are few and large.
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STAFF_APP_IDENTITY, STAFF_BRAND, staffIconPath, startupImages } from '../../lib/staff-apps.ts'
import { STAFF_MARK } from '../../lib/staff-mark.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const sharp = createRequire(createRequire(import.meta.url).resolve('next/package.json'))('sharp')
const FONT = "'Instrument Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"

/** The mark's shapes in its 512 box: the F's bars, the ringed badge, and the app's glyph. */
function markShapes(app) {
  const { radius, bars, badge, glyphStroke, glyphs } = STAFF_MARK
  const { color, ink } = STAFF_BRAND
  return [
    ...bars.map((bar) => `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="${radius}" fill="${ink}"/>`),
    `<circle cx="${badge.cx}" cy="${badge.cy}" r="${badge.r + badge.ring}" fill="${color}"/>`,
    `<circle cx="${badge.cx}" cy="${badge.cy}" r="${badge.r}" fill="${ink}"/>`,
    `<path d="${glyphs[app]}" fill="none" stroke="${color}" stroke-width="${glyphStroke}" stroke-linecap="round" stroke-linejoin="round"/>`,
  ].join('')
}

/** The mark scaled by `scale` about the box's centre, then placed with its box at (x, y), `size` wide. */
function placedMark(app, { x, y, size, scale }) {
  const half = STAFF_MARK.box / 2
  const fit = size / STAFF_MARK.box
  return `<g transform="translate(${x} ${y}) scale(${fit}) translate(${half} ${half}) scale(${scale}) translate(${-half} ${-half})">${markShapes(app)}</g>`
}

/** An icon: the Basil square (rounded for "any", full bleed for maskable and the iPhone), the mark inside. */
function iconSvg(app, { size, rounded, scale }) {
  const corner = rounded ? size * 0.1875 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${corner}" fill="${STAFF_BRAND.color}"/>${placedMark(app, { x: 0, y: 0, size, scale })}</svg>`
}

/** A startup image: Basil, the mark centred a little high, "Foodizar" and the app's line beneath. */
function splashSvg(app, { width, height }) {
  const mark = Math.round(Math.min(width, height) * 0.3)
  const x = (width - mark) / 2
  const y = height / 2 - mark * 0.75
  const title = Math.round(mark * 0.26)
  const titleY = y + mark + title * 1.1
  const subtitleY = titleY + title * 0.95
  const { ink, color, name } = STAFF_BRAND
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${color}"/>`,
    placedMark(app, { x, y, size: mark, scale: 1 }),
    `<text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${title}" fill="${ink}">${name}</text>`,
    `<text x="${width / 2}" y="${subtitleY}" text-anchor="middle" font-family="${FONT}" font-weight="500" font-size="${Math.round(title * 0.5)}" fill="${ink}" fill-opacity="0.85">${STAFF_APP_IDENTITY[app].subtitle}</text>`,
    '</svg>',
  ].join('')
}

/** Renders one SVG to a PNG at `path` (a public URL path). */
async function png(svg, path) {
  const file = join(root, 'public', path)
  await mkdir(dirname(file), { recursive: true })
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 100 }).toFile(file)
}

/** Keeps an SVG source beside the script, committed so a change to the drawing shows in review. */
async function source(svg, name) {
  const file = join(root, 'scripts', 'icons', 'svg', name)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `${svg}\n`)
}

const ICONS = [
  { variant: '192', size: 192, rounded: true, scale: 1 },
  { variant: '512', size: 512, rounded: true, scale: 1 },
  { variant: 'maskable-512', size: 512, rounded: false, scale: 0.8 },
  { variant: 'apple-180', size: 180, rounded: false, scale: 0.9 },
]

for (const app of Object.keys(STAFF_APP_IDENTITY)) {
  for (const icon of ICONS) {
    const svg = iconSvg(app, icon)
    await png(svg, staffIconPath(app, icon.variant))
    if (icon.size === 512) await source(svg, `${app}-${icon.variant}.svg`)
  }
  const splashes = startupImages(app)
  for (const splash of splashes) await png(splashSvg(app, splash), splash.url)
  await source(splashSvg(app, splashes[0]), `${app}-splash.svg`)
  console.log(`${app}: ${ICONS.length} icons, ${splashes.length} startup images`)
}
