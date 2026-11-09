/**
 * themes.js — every look the hall can take.
 *
 * Pick the default in config.js (DEFAULT_THEME), or preview any theme live
 * by adding ?theme=<name> to the URL, e.g.  http://localhost:5500/?theme=neon
 *
 * Each theme describes the same building blocks:
 *   scene / light          background, fog, exposure and light colours
 *   hall / art             optional overrides of the room and artwork sizes
 *   floor / walls / ceiling / skylights
 *   frame                  how artworks are framed
 *   rails / markers        the railing and the viewing circles
 *   character / trail      who walks around and what they leave behind
 *   paper / type           colours and fonts of text painted inside the 3D scene
 *   fonts                  extra Google Fonts the theme needs (loaded on demand)
 *
 * The on-screen UI colours for each theme live in css/style.css under
 * :root[data-theme="<name>"].
 */

export const THEMES = {

  /* ---------------------------------------------------------------
     Black & white gallery — marble, plaster, skylights, ink scribbles
     --------------------------------------------------------------- */
  monochrome: {
    label: 'Monochrome Gallery',
    scene: { background: 0xd6d6d4, fogNear: 45, fogFar: 120, exposure: 1.0 },
    light: { sky: 0xf6f7f9, ground: 0x8f8c87, ambient: 1.1, sun: 0.9, sunColor: 0xffffff, fill: 0.3, spot: 48, spotColor: 0xfff6e8 },
    hall: {},
    art: {},
    floor: { style: 'marble', tile: 6.5, roughness: 0.42 },
    walls: { style: 'plaster', tone: 240, side: 0xffffff, end: 0xdcdcda },
    ceiling: { color: 0xe2e2e0 },
    skylights: { style: 'framed', frame: 0x0d0d0d, glass: 0xffffff },
    frame: { style: 'mat', color: 0x0c0c0c, mat: 0xf3f3f1, roughness: 0.55, metalness: 0, artGlow: 0.28, shadow: 0.4 },
    rails: { style: 'wrap', color: 0x0d0d0d, radius: 0.08 },
    markers: { style: 'pen', color: '#111111' },
    character: { style: 'scribble', ink: 0x0b0b0b, paper: 0xd4d4d2 },
    trail: { style: 'footprints', color: 0x0c0c0c, opacity: 0.5 },
    blob: 0.55,
    panelGlow: 0,
    paper: {
      bg: '#efefec', ink: '#141414', muted: '#6b6b6b', faint: '#9a9a96',
      label: '#f6f6f4', labelBorder: 'rgba(0,0,0,0.12)',
      wallInk: '#121212', wallBody: '#1c1c1c', ghost: 'rgba(17,17,17,0.08)', accent: '#121212',
    },
    type: {
      title:    '900 {s}px "Playfair Display", Georgia, serif',
      titleAlt: 'italic 700 {s}px "Playfair Display", Georgia, serif',
      head:     '500 {s}px "Space Grotesk", Arial, sans-serif',
      headBold: '600 {s}px "Space Grotesk", Arial, sans-serif',
      body:     '400 {s}px Inter, Arial, sans-serif',
    },
    decoration: 'kink',
    demoArt: 'mono',
    fonts: null,
  },

  /* ---------------------------------------------------------------
     Level Editor — a game engine viewport: grid floor, light panels,
     widescreen monitors, wireframe character, electric-blue gizmos
     --------------------------------------------------------------- */
  editor: {
    label: 'Level Editor',
    scene: { background: 0xe6e8eb, fogNear: 50, fogFar: 130, exposure: 1.0 },
    light: { sky: 0xffffff, ground: 0xb4b8bf, ambient: 1.55, sun: 0.75, sunColor: 0xf3f6ff, fill: 0.35, spot: 16, spotColor: 0xffffff },
    hall: { eave: 11.5, peakRise: 0, rowSpacing: 10.5, railInset: 2.2, panelY: 6.0 },
    art: { width: 6.4, height: 3.6, mat: 0, frame: 0.14, depth: 0.18, centerY: 5.0 },
    floor: { style: 'grid', tile: 5, base: '#e9ebee', minor: 'rgba(40,46,56,0.10)', major: 'rgba(40,46,56,0.30)', roughness: 0.9 },
    walls: { style: 'panels', tile: 4, base: '#f5f6f8', seam: 'rgba(40,46,56,0.09)', side: 0xffffff, end: 0xeceef2 },
    ceiling: { color: 0xf1f3f6 },
    skylights: { style: 'panels', frame: 0xc3c9d2, glass: 0xffffff, bar: 0.12 },
    frame: { style: 'screen', color: 0x1a1d22, artGlow: 0.55, shadow: 0.25 },
    rails: { style: 'line', color: 0x2f6bff },
    markers: { style: 'brackets', color: '#2f6bff' },
    character: { style: 'wireframe', face: 0xf6f7f9, line: 0x1d2127 },
    trail: { style: 'dots', color: 0x2f6bff, opacity: 0.55 },
    blob: 0.35,
    panelGlow: 0,
    paper: {
      bg: '#f4f5f7', ink: '#16191e', muted: '#5b6472', faint: '#98a0ab',
      label: '#ffffff', labelBorder: 'rgba(47,107,255,0.45)',
      wallInk: '#16191e', wallBody: '#3a4250', ghost: 'rgba(47,107,255,0.10)', accent: '#2f6bff',
    },
    type: {
      title:    '800 {s}px Inter, Arial, sans-serif',
      titleAlt: '700 {s}px Inter, Arial, sans-serif',
      head:     '500 {s}px "JetBrains Mono", monospace',
      headBold: '700 {s}px "JetBrains Mono", monospace',
      body:     '400 {s}px Inter, Arial, sans-serif',
      titleScale: 0.9, headScale: 0.9,
    },
    decoration: 'terminal',
    demoArt: 'color',
    fonts: 'family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;700;800',
  },

  /* ---------------------------------------------------------------
     Neon Arcade — dark synthwave hall with glowing edges and screens
     --------------------------------------------------------------- */
  neon: {
    label: 'Neon Arcade',
    scene: { background: 0x07060d, fogNear: 22, fogFar: 95, exposure: 1.05 },
    light: { sky: 0x6a4ab8, ground: 0x07060d, ambient: 1.0, sun: 0.2, sunColor: 0xa98bff, fill: 0.12, spot: 24, spotColor: 0xd9f6ff },
    hall: { eave: 11.5, peakRise: 0, rowSpacing: 10.5, panelY: 6.0 },
    art: { width: 6.4, height: 3.6, mat: 0, frame: 0.16, depth: 0.2, centerY: 5.0 },
    floor: { style: 'grid', tile: 5, base: '#0a0913', minor: 'rgba(0,229,255,0.16)', major: 'rgba(255,43,214,0.8)', glow: 1.4, roughness: 0.3, metalness: 0.2 },
    walls: { style: 'panels', tile: 4, base: '#15122a', seam: 'rgba(0,229,255,0.14)', side: 0xffffff, end: 0xd8d0ff },
    ceiling: { color: 0x2a2640 },
    skylights: { style: 'neon', colors: [0xff2bd6, 0x00e5ff] },
    frame: { style: 'screen', color: 0x0c0b12, artGlow: 0.95, shadow: 0, glow: 0x00e5ff },
    rails: { style: 'wrap', color: 0xff2bd6, radius: 0.06, glow: true },
    markers: { style: 'ring', color: '#00e5ff', glow: true },
    character: { style: 'wireframe', face: 0x0b0a14, line: 0x00e5ff, glow: true },
    trail: { style: 'dots', color: 0xff2bd6, opacity: 0.85, glow: true },
    blob: 0.6,
    panelGlow: 1.6,
    paper: {
      bg: '#0f0d1a', ink: '#f4efff', muted: '#b3a9d6', faint: '#6f6690',
      label: '#141225', labelBorder: 'rgba(0,229,255,0.6)',
      wallInk: '#ffffff', wallBody: '#c9c0e8', ghost: 'rgba(255,43,214,0.18)', accent: '#ff2bd6',
    },
    type: {
      title:    '800 {s}px Unbounded, Arial, sans-serif',
      titleAlt: '700 {s}px Unbounded, Arial, sans-serif',
      head:     '500 {s}px "JetBrains Mono", monospace',
      headBold: '700 {s}px "JetBrains Mono", monospace',
      body:     '400 {s}px Inter, Arial, sans-serif',
      titleScale: 0.7, headScale: 0.9,
    },
    decoration: 'rule',
    demoArt: 'color',
    fonts: 'family=Unbounded:wght@500;700;800&family=JetBrains+Mono:wght@400;500;700',
  },

  /* ---------------------------------------------------------------
     Pixel Quest — chunky retro 8-bit castle hall
     --------------------------------------------------------------- */
  pixel: {
    label: 'Pixel Quest',
    scene: { background: 0x2b1b2e, fogNear: 60, fogFar: 140, exposure: 1.0 },
    light: { sky: 0xfff4d6, ground: 0x6b5a8a, ambient: 1.5, sun: 0.95, sunColor: 0xfff1c9, fill: 0.35, spot: 20, spotColor: 0xfff1a8 },
    hall: { eave: 11.5, peakRise: 0, rowSpacing: 10.5, panelY: 6.0 },
    art: { width: 6.4, height: 3.6, mat: 0, frame: 0.42, depth: 0.3, centerY: 5.0 },
    floor: { style: 'checker', tile: 3, a: '#3b6fb0', b: '#2f5a93', roughness: 1 },
    walls: { style: 'bricks', tile: 4, brick: '#e7b08d', mortar: '#b97b61', side: 0xffffff, end: 0xf3d6c0 },
    ceiling: { color: 0x6b3e2e },
    skylights: { style: 'panels', frame: 0x3b2320, glass: 0xfff1a8, bar: 0.32 },
    frame: { style: 'pixel', color: 0xffc94a, inner: 0x5a3322, artGlow: 0.4, shadow: 0.35 },
    rails: { style: 'blocks', color: 0xd9443f, alt: 0xffc94a },
    markers: { style: 'pixel', color: '#ffffff' },
    character: { style: 'voxel', colors: { skin: 0xffcfa0, hair: 0x5a3322, shirt: 0xd9443f, pants: 0x2f4fa8, shoes: 0x2b1b2e } },
    trail: { style: 'pixels', color: 0xffffff, opacity: 0.55 },
    blob: 0.45,
    panelGlow: 0,
    paper: {
      bg: '#fff4d6', ink: '#2b1b2e', muted: '#7a4e3a', faint: '#b08a6f',
      label: '#fff4d6', labelBorder: '#2b1b2e',
      wallInk: '#2b1b2e', wallBody: '#4a2e2a', ghost: 'rgba(217,68,63,0.16)', accent: '#d9443f',
    },
    type: {
      title:    '400 {s}px "Press Start 2P", monospace',
      titleAlt: '400 {s}px "Press Start 2P", monospace',
      head:     '400 {s}px "Press Start 2P", monospace',
      headBold: '400 {s}px "Press Start 2P", monospace',
      body:     '400 {s}px VT323, monospace',
      titleScale: 0.5, headScale: 0.62, bodyScale: 1.35,
    },
    pixelated: true,
    panelBoard: true,
    decoration: 'pixel',
    demoArt: 'color',
    fonts: 'family=Press+Start+2P&family=VT323',
  },

  /* ---------------------------------------------------------------
     Cozy Pastel — soft colours, rounded shapes, toy-like character
     --------------------------------------------------------------- */
  pastel: {
    label: 'Cozy Pastel',
    scene: { background: 0xf6e7f0, fogNear: 50, fogFar: 130, exposure: 1.0 },
    light: { sky: 0xfff3f8, ground: 0xcdb8f0, ambient: 1.55, sun: 0.75, sunColor: 0xfff2e2, fill: 0.35, spot: 20, spotColor: 0xfff4e6 },
    hall: { rowSpacing: 10 },
    art: { width: 6.0, height: 4.0, mat: 0.34, frame: 0.26, depth: 0.22, centerY: 5.4 },
    floor: { style: 'tiles', tile: 2.5, base: '#f6d3bd', grout: '#e9b89c', roughness: 0.7 },
    walls: { style: 'plaster', tone: 246, side: 0xd8cbf6, end: 0xbfe6d6 },
    ceiling: { color: 0xf8d9e6 },
    skylights: { style: 'framed', frame: 0xf3a8c6, glass: 0xfffbf2 },
    frame: { style: 'mat', color: 0x8fc9e8, mat: 0xfffaf2, roughness: 0.6, metalness: 0, artGlow: 0.3, shadow: 0.22 },
    rails: { style: 'wrap', color: 0xf3a8c6, radius: 0.13 },
    markers: { style: 'soft', color: '#e58fb5' },
    character: {
      style: 'toon',
      colors: { head: 0xffe3c9, torso: 0x7fd4e8, arm: 0xffe3c9, leg: 0x9a8ad8, foot: 0xf28482 },
      outline: 0x5a4a6b, eyes: 0x3d3350, blush: 0xf5a3b5, hair: 0x7a5aa6,
    },
    trail: { style: 'dots', color: 0xe58fb5, opacity: 0.5 },
    blob: 0.35,
    panelGlow: 0,
    paper: {
      bg: '#fff8f2', ink: '#4b3d5c', muted: '#7f6f93', faint: '#b3a5c4',
      label: '#fffaf5', labelBorder: 'rgba(229,143,181,0.6)',
      wallInk: '#4b3d5c', wallBody: '#6a5a7f', ghost: 'rgba(229,143,181,0.2)', accent: '#e58fb5',
    },
    type: {
      title:    '600 {s}px Fredoka, Arial, sans-serif',
      titleAlt: '500 {s}px Fredoka, Arial, sans-serif',
      head:     '700 {s}px Nunito, Arial, sans-serif',
      headBold: '800 {s}px Nunito, Arial, sans-serif',
      body:     '400 {s}px Nunito, Arial, sans-serif',
    },
    decoration: 'wave',
    demoArt: 'color',
    fonts: 'family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800',
  },

  /* ---------------------------------------------------------------
     Noir Museum — dark walls, gold frames, velvet ropes, pools of light
     --------------------------------------------------------------- */
  noir: {
    label: 'Noir Museum',
    scene: { background: 0x14120f, fogNear: 30, fogFar: 105, exposure: 1.15 },
    light: { sky: 0xb7a184, ground: 0x2a231c, ambient: 1.65, sun: 0.6, sunColor: 0xffe2b8, fill: 0.3, spot: 78, spotColor: 0xffd9a0, spotAngle: Math.PI / 6.5 },
    hall: { eave: 12.5, peakRise: 0, rowSpacing: 10.5 },
    art: { width: 6.2, height: 3.5, mat: 0.34, frame: 0.3, depth: 0.24, centerY: 5.4 },
    floor: { style: 'polished', tile: 7, base: '#4b443c', roughness: 0.32, metalness: 0.1 },
    walls: { style: 'plaster', tone: 236, side: 0x766a60, end: 0x615850 },
    ceiling: { color: 0x3a342e },
    skylights: { style: 'none' },
    frame: { style: 'mat', color: 0xb8913a, mat: 0xece2cc, roughness: 0.35, metalness: 0.65, artGlow: 0.18, shadow: 0.5 },
    rails: { style: 'ropes', post: 0xb8913a, rope: 0x6b1822 },
    markers: { style: 'ring', color: '#c9a55a', glow: false },
    character: {
      style: 'voxel',
      colors: { skin: 0xdcc9a6, hair: 0x1a1613, shirt: 0x5c5247, pants: 0x3a322b, shoes: 0x14110e, accent: 0xc9a55a },
    },
    trail: { style: 'none' },
    blob: 0.5,
    panelGlow: 0.72,   // the wall text carries its own light, so the lower
                       // paragraphs stay readable past the spotlight's falloff
    paper: {
      bg: '#ece2cc', ink: '#1c1917', muted: '#6d6254', faint: '#9d9181',
      label: '#ece2cc', labelBorder: 'rgba(0,0,0,0.25)',
      wallInk: '#e9dcc0', wallBody: '#dccfb2', ghost: 'rgba(28,25,23,0.08)', accent: '#c9a55a',
    },
    type: {
      title:    '600 {s}px "Cormorant Garamond", Georgia, serif',
      titleAlt: 'italic 600 {s}px "Cormorant Garamond", Georgia, serif',
      head:     '500 {s}px Inter, Arial, sans-serif',
      headBold: '500 {s}px Inter, Arial, sans-serif',
      body:     '300 {s}px Inter, Arial, sans-serif',
      titleScale: 1.15,
    },
    decoration: 'rule',
    demoArt: 'color',
    fonts: 'family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600',
  },
};
