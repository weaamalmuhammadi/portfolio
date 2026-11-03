/**
 * config.js — everything you'd normally want to edit lives in this file.
 *
 *   SITE      your name, role and the short bio painted on the back wall
 *   CONTACT   email (used for the mailto: link) and optional social links
 *   PROJECTS  one entry per framed artwork — add or remove entries freely,
 *             the hall grows or shrinks to fit them
 *   HALL / ART / MOVE / CAM   room proportions and how walking & the camera feel
 *   DEFAULT_THEME             the look of the hall (all themes live in themes.js)
 *
 * Everything below the "DERIVED LAYOUT" line is computed from the values
 * above it, so you shouldn't need to touch it.
 */

import { THEMES } from './themes.js';

/* =============================================
   THEME
   Preview any theme with ?theme=<name> in the URL:
   monochrome · editor · neon · pixel · pastel · noir
   Add ?demo to fill the frames with sample artwork.
   ============================================= */
export const DEFAULT_THEME = 'noir';

const params = new URLSearchParams(window.location.search);
export const THEME_NAME = THEMES[params.get('theme')] ? params.get('theme') : DEFAULT_THEME;
export const THEME = THEMES[THEME_NAME];
export const DEMO_ART = params.has('demo');

/* =============================================
   SITE & CONTACT
   ============================================= */
export const SITE = {
  name: 'Weaam',
  role: 'Game Developer & Programmer',
  // Painted on the back wall of the hall — keep it to 2–3 short paragraphs.
  bio: [
    'Weaam is a game developer and programmer who builds worlds, engines and the tools behind them.',
    'Every piece in this hall started as a question — how does it feel, how does it move, how does it break — and ended as something you can play.',
    'Take your time. Step into a circle to look closer.',
  ],
};

export const CONTACT = {
  email: 'weaamalmuhammadi@gmail.com',
  // Shown in the menu and the contact panel. Add more the same way.
  // Example: { label: 'GitHub', url: 'https://github.com/your-name' }
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/weaam-almuhammadi-865501323/' },
  ],
};

/* =============================================
   PROJECTS
   Artworks alternate left wall / right wall in this order.
   `image` is the file name (without extension) inside assets/paintings/ —
   .jpg, .png or .webp all work. Until a file exists a sketch placeholder shows.

   For a gameplay video instead of a photo, give the entry both:
     poster: 'assets/projects/<name>.jpg'   the still shown from across the hall
     video:  'assets/projects/<name>.mp4'   plays (muted, looping) while you stand
                                            in its circle — only downloaded then
   ============================================= */
export const PROJECTS = [
  {
    title: 'Immersive Canvas', category: 'Mixed Reality', year: '2026',
    tech: ['Unity', 'URP', 'C#'],
    desc: 'A mixed-reality painting app: draw in the air or straight onto the walls and tables around you, in full passthrough. A floating toolbar holds the colour wheel, wide and fine brushes, eraser, undo and save, and you can drop in 3D models and paint them too.',
    // no `link` — the panel then shows no link at all
    poster: 'assets/projects/project-01.jpg',
    video: 'assets/projects/project-01.mp4',
  },
  {
    title: 'Presentation Coach', category: 'VR', year: '2026',
    tech: ['Unity', 'C#', 'Meta Quest', 'Whisper', 'Gemini'],
    desc: 'A VR app for rehearsing a talk on Meta Quest. You present to a virtual room with your slides and outline in front of you; it listens, watches how you move, then scores the run out of 10 and writes back coaching notes. Speak Gulf Arabic, English, or switch between the two.',
    // Optional — a few short lines under the description, for the parts worth bragging about
    highlights: [
      'Reads your body language and your voice — frozen on the spot, fidgeting hands, hands clasped, a flat monotone — and tells you how your body language came across',
      'Catches your filler words',
      'Marks you against the outline you wrote, point by point, so you can see what you covered and what you skipped',
      'A virtual audience is listening: say “any questions” and someone raises a hand and asks you a real question about what you just presented',
    ],
    poster: 'assets/projects/project-02.jpg',
    video: 'assets/projects/project-02.mp4',
  },
  {
    title: 'Simple Game', category: 'Web App', year: '2026',
    tech: ['React', 'Phaser', 'Vite', 'Canvas API'],
    desc: 'A game builder for children, where their own drawings become the game. Upload a player, the ground, a goal and an enemy, press Start, and the platformer is playable in the browser a second later — physics, enemies, winning and losing included.',
    highlights: [
      'Cuts each drawing off the paper with a hand-written Canvas routine — no AI model, no library — clearing inward from the edges so white areas inside the drawing survive, and allowing for uneven light on the page',
      'When there is no clear background to remove, it keeps the original drawing and says so rather than damaging it',
      'The game runs on the same page as the builder, so a new drawing is one press away from being played',
      'Nothing leaves the device — the drawings are processed in the browser and never uploaded — and it reads in English or Arabic, with a full right-to-left layout and day and night themes',
    ],
    poster: 'assets/projects/project-03.jpg',
    video: 'assets/projects/project-03.mp4',
  },
  {
    title: 'الراوي — The Storyteller', category: 'Web Game', year: '2026',
    tech: ['Vanilla JS', 'Firebase', 'Firestore'],
    desc: 'An Arabic take on Dixit for four players online, themed around Saudi Founding Day (يوم بدينا, 1727). The host shares a room code; each round one player is the storyteller and gives a clue for a card, everyone else plays a card to match it, then votes on which card was the storyteller’s. Bots fill any empty seats.',
    highlights: [
      'Plain JavaScript modules — no framework, no build step — with Firestore keeping every player in step through live listeners',
      'Each player’s hand, card and vote sit in their own private document, so nobody can read the others’ cards out of the shared room state',
      'The host’s browser runs the match: dealing, the bots, the phases from clue to submit to vote to reveal, and the scoring',
      'Players sign in anonymously and the seat is remembered, so a refresh drops you back into the same game',
    ],
    poster: 'assets/projects/project-04.jpg',
    video: 'assets/projects/project-04.mp4',
  },
  {
    title: 'Card Bounce', category: 'AR Game', year: '2026',
    tech: ['Python', 'OpenCV', 'Pymunk', 'Pygame'],
    desc: 'An augmented-reality game played against your own screen. Balls fall, and you steer them into the basket with a real paper note or card — stuck to the glass, or held on a stick in front of it. A camera watches the screen, measures where your card is, how big it is and how far it is tilted, and turns it into a solid, bouncy wall inside the physics world. Eight levels, each checked by a solver to be winnable with three cards or fewer.',
    highlights: [
      'Calibrates itself by showing a chessboard and working out the mapping from camera pixels to game pixels — under a pixel of error, and it copes with a camera that is rotated or mirrored',
      'Tells paper from glare and hands: a shape has to be sharp-edged, properly rectangular, thick enough and bright enough, and a stick merged with the card is cut away before the card is judged',
      'Masks out everything the game itself draws, so it never mistakes its own graphics for a card, and keeps relearning the empty screen as the room light drifts',
      'Each card becomes a physics body that glides to where it is predicted to be next, so swinging it really does knock the balls away',
    ],
    poster: 'assets/projects/project-05.jpg',
    video: 'assets/projects/project-05.mp4',
  },
  {
    title: 'Echo Maze', category: 'Horror Game', year: '2026',
    tech: ['Unity', 'C#'],
    desc: 'A first-person horror game played in complete darkness. The only way to see is to make noise: speak into the microphone and the scan paints glowing dots across the walls, warm where they are close and cold where they are far. A blind monster is listening for exactly the same sound. Reach the exit and your time goes on the leaderboard — make too much noise on the way and it finds you first.',
    highlights: [
      'Your voice is the torch — the louder you are into the microphone, the more of the maze each scan lights up',
      'Every scan is a gamble: the noise that shows you the walls also tells the monster where you are, and louder noise carries further and points at you more precisely',
      'The monster wanders, reacts, chases, then searches around the last sound it heard — and its own sounds are 3D and muffled through walls, so you can track it by ear',
      'Footsteps make no sound at all, so sprinting always outruns it, while walking only outpaces it on the easier settings',
    ],
    poster: 'assets/projects/project-06.jpg',
    video: 'assets/projects/project-06.mp4',
  },
];

/* =============================================
   HALL — room proportions (world units; the visitor is ~2.3 tall)
   ============================================= */
export const HALL = {
  width: 21,           // wall to wall
  eave: 13.5,          // wall height, where the roof starts
  peakRise: 5.5,       // extra height up to the roof ridge
  frontZ: 16,          // wall behind the entrance
  startZ: 3,           // where the visitor appears
  firstRowZ: -6,       // first pair of artworks
  rowSpacing: 8.5,     // distance between pairs — lower = closer together
  endDepth: 9.5,       // space between the last pair and the back wall
  railInset: 2.4,      // how far the black railing sits from the walls
  railHeight: 1.3,
  circleRadius: 1.45,  // viewing circle in front of each artwork
  circleInset: 1.9,    // distance from the railing to a circle's centre
  contactRadius: 2.1,  // "get in touch" circle by the back wall
  approach: 3.6,       // extra distance at which the floating title appears
  panelWidth: 9.4,     // bio text on the back wall
  panelY: 6.9,
};
Object.assign(HALL, THEME.hall);   // a theme may reshape the room (e.g. a flat ceiling)

/* Artwork + frame sizes */
export const ART = {
  width: 4.2,          // the picture itself (portrait, ~2:3)
  height: 6.1,
  mat: 0.42,           // white passe-partout around the picture
  frame: 0.3,          // black frame moulding
  depth: 0.24,
  centerY: 5.8,        // height of the picture's centre on the wall
};
Object.assign(ART, THEME.art);     // e.g. widescreen frames for game screenshots

/* Lighting comes from the theme (themes.js → light):
   ambient = soft sky fill, sun = key light that casts the railing shadows,
   fill = weak opposite light, spot = lamp above each artwork */
export const LIGHT = { spotAngle: Math.PI / 7, ...THEME.light };

/* Walking */
export const MOVE = {
  speed: 5.2,          // walking speed (units per second)
  travelSpeed: 8.5,    // when walking somewhere picked from the menu
  accel: 9,            // how quickly the visitor gets up to speed
  decel: 11,           // how quickly they come to a stop
  stride: 0.78,        // distance between footprints
  stepRate: 3.1,       // leg swing per unit walked
  dwell: 0.3,          // seconds standing still in a circle before the camera moves in
};

/* Camera */
export const CAM = {
  fov: 55,             // follow camera field of view
  focusFov: 42,        // narrower lens while looking at an artwork
  height: 4.9,         // follow camera height
  distance: 9.8,       // follow camera distance behind the visitor
  lookHeight: 2.0,
  lookAhead: 10,
  followLambda: 4.2,   // higher = snappier follow
  focusLambda: 2.4,    // glide speed into an artwork
  parallax: 0.45,      // gentle mouse parallax (desktop only)
  introDuration: 2.8,  // seconds of the fly-in after entering
  exposure: THEME.scene.exposure,
};

/* =============================================
   DERIVED LAYOUT — computed, no need to edit
   ============================================= */
export const WALL_X = HALL.width / 2;
export const PEAK_Y = HALL.eave + HALL.peakRise;

export const FRAME = {
  w: ART.width + 2 * (ART.mat + ART.frame),
  h: ART.height + 2 * (ART.mat + ART.frame),
};

/* Each project gets a wall side and a position along the hall */
export const ARTWORKS = PROJECTS.map((p, index) => ({
  ...p,
  index,
  side: index % 2 === 0 ? 'left' : 'right',
  z: HALL.firstRowZ - Math.floor(index / 2) * HALL.rowSpacing,
}));

export const LAYOUT = (() => {
  const rows      = Math.max(1, Math.ceil(PROJECTS.length / 2));
  const lastRowZ  = HALL.firstRowZ - (rows - 1) * HALL.rowSpacing;
  const backZ     = lastRowZ - HALL.endDepth;
  const frontZ    = HALL.frontZ;
  const railX     = WALL_X - HALL.railInset;
  const railBackZ = backZ + HALL.railInset;

  return {
    rows, lastRowZ, backZ, frontZ, railX, railBackZ,
    length: frontZ - backZ,
    centerZ: (frontZ + backZ) / 2,
    startZ: HALL.startZ,
    circleX: railX - HALL.circleInset,
    // The walkable area inside the railing
    walk: { xMax: railX - 0.75, zMin: railBackZ + 0.75, zMax: HALL.startZ + 1.5 },
    contact: { x: 0, z: railBackZ + 0.8 + HALL.contactRadius, r: HALL.contactRadius },
  };
})();
