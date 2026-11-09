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
    tech: ['Unity 6', 'C#', 'Meta XR SDK', 'MRUK', 'OpenXR', 'Meta Spatial Anchors', 'URP'],
    desc: 'A mixed-reality creative space that turns your physical surroundings into a canvas. Built for Meta Quest, Immersive Canvas lets users draw directly on real-world walls, create freehand 3D drawings in mid-air, and place interactive 3D models throughout their environment. Blending digital art with physical spaces, every creation can be saved and revisited in future sessions.',
    highlights: [
      '2D Surface Painting: Create drawings on real walls using a customizable virtual canvas.',
      '3D Freehand Drawing: Paint freely in mid-air with colorful 3D strokes.',
      '3D Model Placement: Browse, place, resize, and customize 3D models within your environment.',
      'Interactive Drawing Tools: Access a floating palette with a color wheel, adjustable brush sizes, eraser, and undo.',
      'Spatial Persistence: Save drawings and placed models using spatial anchors, allowing creations to remain in their physical locations across sessions.',
      'Image Export: Export 2D artwork as PNG and upload it to a companion website.',
    ],
    // no `link` — the panel then shows no link at all
    poster: 'assets/projects/project-01.jpg',
    video: 'assets/projects/project-01.mp4',
  },
  {
    title: 'Presentation Coach', category: 'VR', year: '2026',
    tech: ['Unity', 'C#', 'Meta Quest', 'Whisper', 'Gemini'],
    desc: 'An AI-powered VR public speaking coach built for Meta Quest. Practice your presentations in an immersive virtual environment with your slides and outline in front of you. The app analyzes your speech and body language, then provides a performance score and personalized feedback.',
    // Optional — a few short lines under the description, for the parts worth bragging about
    highlights: [
      'Body Language Analysis: Detects behaviors such as excessive movement, lack of movement, and closed hand gestures to evaluate non-verbal communication.',
      'Speech Analysis: Identifies filler words, monotone delivery, and speaking patterns.',
      'Outline Tracking: Evaluates your presentation against your planned outline, highlighting covered and missed key points.',
      'Interactive Virtual Audience: When the presenter says "Any Questions?", one of the virtual audience members raises their hand and asks a relevant question based on the presentation, simulating a real audience Q&A experience.',
      'Multilingual Support: Understands Gulf Arabic and English, including presentations that switch between both languages.',
    ],
    poster: 'assets/projects/project-02.jpg',
    video: 'assets/projects/project-02.mp4',
  },
  {
    title: 'Simple Game', category: 'Web App', year: '2026',
    tech: ['React', 'Phaser', 'Vite', 'Canvas API'],
    desc: 'A browser-based game builder that turns children’s drawings into playable platformer games. Children can draw their own characters, enemies, platforms, and goals, then bring them to life in an interactive game, no coding required.',
    highlights: [
      'Drawing-to-Game: Converts children’s drawings into playable game assets.',
      'Custom Background Removal: Uses a custom Canvas-based algorithm to remove paper backgrounds while preserving details and handling uneven lighting — without AI or external libraries.',
      'Instant Gameplay: Generates and runs the game directly within the browser.',
      'Privacy-First: Processes all drawings locally without uploading them.',
      'Bilingual Interface: Supports Arabic (RTL) and English, with light and dark themes.',
    ],
    poster: 'assets/projects/project-03.jpg',
    video: 'assets/projects/project-03.mp4',
  },
  {
    title: 'الراوي — The Storyteller', category: 'Web Game', year: '2026',
    tech: ['Vanilla JS', 'Firebase', 'Firestore'],
    desc: 'An online multiplayer storytelling card game inspired by Dixit, celebrating Saudi Founding Day (1727). Designed for four players, the game brings storytelling, creativity, and deduction together. Players take turns giving clues for their cards while others submit matching cards and vote to identify the storyteller’s original choice. AI-free bots fill empty seats to keep the game going.',
    highlights: [
      'Multiplayer Gameplay: Join private game rooms using a shared room code and play with up to four players.',
      'Storytelling & Deduction: Take turns creating clues, submitting cards, and guessing the storyteller’s original card.',
      'Bot Players: Automatically fills vacant seats with bots to ensure a complete game.',
      'Real-Time Synchronization: Uses Firebase Firestore listeners to keep all players synchronized throughout each round.',
      'Private Player Data: Stores each player’s hand, selected card, and vote in separate private documents, preventing other players from accessing hidden game information through the shared room state.',
      'Persistent Game Sessions: Anonymous authentication and seat persistence allow players to return to their game after refreshing the browser.',
    ],
    poster: 'assets/projects/project-04.jpg',
    video: 'assets/projects/project-04.mp4',
  },
  {
    title: 'Card Bounce', category: 'AR Game', year: '2026',
    tech: ['Computer Vision', 'Physics Simulation', 'Interactive Gaming'],
    desc: 'A camera-based augmented reality game that turns real-world paper cards into interactive physics objects. Players guide falling balls into a basket by moving a physical paper card in front of the screen. The camera tracks the card’s position, size, and rotation, translating its real-world movement into a dynamic, bouncing obstacle inside the game.',
    highlights: [
      'Real-Time Card Tracking: Detects and tracks physical cards using computer vision, measuring their position, size, and orientation.',
      'Camera Calibration: Automatically maps camera coordinates to game coordinates, accounting for rotated and mirrored camera views with sub-pixel accuracy.',
      'Robust Object Detection: Distinguishes actual cards from glare, hands, and background noise, while filtering out the game’s own visual elements.',
      'Physics-Based Interaction: Converts detected cards into dynamic physics objects that respond smoothly to real-world movement.',
      'Adaptive Background Detection: Continuously updates the background model to handle changing lighting conditions.',
      'Eight Challenging Levels: Features eight levels, each validated by a solver to ensure it can be completed using three cards or fewer.',
    ],
    poster: 'assets/projects/project-05.jpg',
    video: 'assets/projects/project-05.mp4',
  },
  {
    title: 'Echo Maze', category: 'Horror Game', year: '2026',
    tech: ['Audio Mechanics', 'AI Behavior', 'Spatial Audio'],
    desc: 'A first-person horror game where sound is both your vision and your greatest threat. Explore a pitch-black maze where your voice reveals the environment through glowing sound-based scans. But every sound also alerts a blind creature hunting you. Find the exit before it tracks you down, and compete for the fastest escape time on the leaderboard.',
    highlights: [
      'Voice-Powered Vision: Uses microphone input to generate visual scans, revealing nearby walls and obstacles through glowing particles. Color and intensity indicate distance.',
      'Risk-Reward Sound Mechanics: Louder sounds reveal more of the environment but also expose your position more precisely to the monster.',
      'Dynamic Monster AI: Features multiple behavior states, including wandering, sound detection, chasing, and searching the last known sound location.',
      '3D Spatial Audio: Uses directional audio and wall-based sound muffling to help players locate the monster by listening to its movements.',
      'Stealth & Difficulty Mechanics: Silent footsteps allow players to move without alerting the monster, with movement speed and difficulty affecting escape strategies.',
      'Competitive Leaderboard: Records players’ escape times, encouraging replayability and faster runs.',
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
