# Weaam — portfolio

A portfolio you walk through. It's a 3D gallery built with Three.js: you move a
character down a hall with six framed projects, and standing still in front of
one brings the camera in and plays its gameplay video while the details appear
beside it.

**Weaam Almuhammadi** — game developer & programmer
[weaamalmuhammadi@gmail.com](mailto:weaamalmuhammadi@gmail.com) · [LinkedIn](https://www.linkedin.com/in/weaam-almuhammadi-865501323/)

## Running it

The page loads as ES modules, so opening `index.html` from the file system
won't work — it has to be served over HTTP:

```bash
npx serve .
```

Then open the address it prints (usually <http://localhost:3000>).

## Walking around

| Action | How |
| --- | --- |
| Move | `W` `A` `S` `D` or the arrow keys |
| Walk somewhere | Click the floor, or click a project |
| See a project | Stand still in its circle; walk away to leave |
| Open the menu | `Esc` — pick any project and the character walks there |
| Get in touch | Stand in the circle by the back wall |

On a phone, tap the floor to walk.

## The projects

| | Project | What it is |
| --- | --- | --- |
| 01 | Immersive Canvas | Mixed-reality painting app (Unity, URP) |
| 02 | Presentation Coach | VR presentation rehearsal with scoring and coaching feedback (Unity, Whisper, Gemini) |
| 03 | Simple Game | Children's drawings turned into playable platformers (React, Phaser) |
| 04 | الراوي — The Storyteller | Arabic online multiplayer card game (vanilla JS, Firestore) |
| 05 | Card Bounce | AR physics game played with real cards and a camera (Python, OpenCV, Pymunk) |
| 06 | Echo Maze | Horror maze lit only by sound (Unity) |

## Changing it

Almost everything lives in [`js/gallery/config.js`](js/gallery/config.js):
your name and bio, contact details, and the project list. Adding a project
there adds a frame and makes the hall longer; each entry can carry a `poster`
image and a `video` that plays when a visitor steps up to it.

The look is a theme. Six are defined in
[`js/gallery/themes.js`](js/gallery/themes.js) — `noir` (the current one),
`monochrome`, `editor`, `neon`, `pixel` and `pastel`. Preview any of them by
adding `?theme=neon` to the address, add `&demo` to fill the frames with
sample artwork, and set `DEFAULT_THEME` in `config.js` to keep one.

## Layout

```
index.html          the page: intro screen + the gallery interface
css/style.css       all styling, including each theme's interface colours
js/intro.js         the opening title screen and the transition into the hall
js/gallery/
  main.js           entry point: input, movement, camera, the frame loop
  config.js         your details, the projects, room proportions
  themes.js         the six looks
  world.js          builds the hall: floor, walls, frames, lighting, railing
  character.js      the visitor and the trail they leave
  textures.js       every surface, drawn in code onto canvases
  ui.js             the menu, the project panel, the on-screen controls
assets/projects/    project videos and their poster frames
assets/paintings/   drop image files here to use photos instead of video
```

Built with [Three.js](https://threejs.org) and [GSAP](https://gsap.com), both
loaded from a CDN. No build step and no dependencies to install.
