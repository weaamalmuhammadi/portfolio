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


