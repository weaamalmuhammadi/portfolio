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
    tech: ['Unity 6', 'C#', 'Meta XR SDK', 'MRUK', 'OpenXR', 'Spatial Anchors', 'URP'],
    desc: 'A mixed-reality creative space that turns the room around you into a canvas. Built for Meta Quest: paint straight onto your real walls, draw freehand in mid-air, and place 3D models through the space, with a floating palette holding the colour wheel, brush sizes, eraser and undo.',
    highlights: [
      'Draw on your real walls through a virtual canvas you can size and place to suit the room',
      'Paint freehand in mid-air, leaving colourful 3D strokes hanging in the space around you',
      'Browse, place, resize and customise 3D models anywhere in your environment',
      'Spatial anchors hold every drawing and model in its real place, so your work is still waiting there the next time you put the headset on',
      'Export a 2D piece as a PNG and upload it to the companion website',
    ],
    // no `link` — the panel then shows no link at all
    poster: 'assets/projects/project-01.jpg',
    video: 'assets/projects/project-01.mp4',
  },
  {
    title: 'Presentation Coach', category: 'VR', year: '2026',
    tech: ['Unity', 'C#', 'Meta Quest', 'Whisper', 'Gemini'],
    desc: 'An AI-powered VR public-speaking coach built for Meta Quest. Rehearse your talk in an immersive room with your slides and outline in front of you; the app analyses your speech and your body language, then gives you a performance score out of 10 and personalised feedback.',
    // Optional — a few short lines under the description, for the parts worth bragging about
    highlights: [
      'Body language: catches pacing about, standing frozen and closed-off hand gestures, and tells you how your presence came across',
      'Speech: picks out your filler words, a flat monotone, and the patterns in the way you speak',
      'Outline tracking: marks your talk against the outline you planned, showing what you covered and what you missed',
      'An audience that answers back — say “Any questions?” and one of them raises a hand and asks a real question drawn from what you just presented',
      'Understands Gulf Arabic and English, including a presentation that switches between the two',
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
    desc: 'An online multiplayer storytelling card game inspired by Dixit, celebrating Saudi Founding Day (يوم بدينا, 1727). Built for four players, it puts storytelling, creativity and deduction together: each round one player gives a clue for a card, the others submit cards that match it, then everyone votes on which card was the storyteller’s.',
    highlights: [
      'Private rooms — share a code and up to four players sit down to the same game',
      'Bots take any empty seat, plain rule-based players rather than AI, so a game always runs',
      'Firestore listeners keep every player in step, round by round, in real time',
      'Each player’s hand, chosen card and vote live in their own private document, so nobody can read hidden information out of the shared room state',
      'Anonymous sign-in and seat persistence mean a refresh drops you straight back into your game',
    ],
    poster: 'assets/projects/project-04.jpg',
    video: 'assets/projects/project-04.mp4',
  },
  {
    title: 'Card Bounce', category: 'AR Game', year: '2026',
    tech: ['Python', 'OpenCV', 'Pymunk', 'Pygame', 'Computer Vision'],
    desc: 'A camera-based augmented-reality game that turns a real paper card into an interactive physics object. Balls fall down the screen and you steer them into the basket by moving the card in front of it — the camera reads its position, size and rotation, and turns that movement into a bouncing obstacle inside the game. Eight levels, each checked by a solver to be winnable with three cards or fewer.',
    highlights: [
      'Real-time card tracking: computer vision finds the card every frame and measures where it is, how big it is and which way it is turned',
      'Camera calibration maps camera coordinates onto game coordinates with sub-pixel accuracy, and copes with a view that is rotated or mirrored',
      'Robust detection tells a real card from glare, hands and background clutter — and filters out the game’s own graphics so it never chases its own picture',
      'Each detected card becomes a physics body that follows your real movement smoothly, so swinging it really does knock the balls away',
      'The background model keeps updating itself, so the game holds up as the light in the room changes',
    ],
    poster: 'assets/projects/project-05.jpg',
    video: 'assets/projects/project-05.mp4',
  },
  {
    title: 'Echo Maze', category: 'Horror Game', year: '2026',
    tech: ['Unity', 'C#', 'Audio Mechanics', 'AI Behaviour', 'Spatial Audio'],
    desc: 'A first-person horror game where sound is both your eyes and your greatest danger. Explore a pitch-black maze where your own voice reveals the walls as glowing scans — and every sound you make alerts the blind creature hunting you. Find the exit before it finds you, and race the leaderboard for the fastest escape.',
    highlights: [
      'Voice-powered vision: the microphone drives each scan, and the glowing particles that come back are coloured by distance — warm up close, cold far away',
      'Risk and reward: a louder sound reveals more of the maze, and at the same time tells the monster more precisely where you are',
      'The monster really hunts — wandering, catching a sound, chasing it down, then searching around the last place it heard you',
      'Its own movements are 3D and muffled through walls, so you can place it by ear before you can see it',
      'Footsteps make no sound at all, so you can slip away unheard — your speed and the difficulty decide whether you creep or run for it',
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
