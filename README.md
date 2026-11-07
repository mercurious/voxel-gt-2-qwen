# VOXEL TOURING GT

A browser racing game with voxel cars and tracks: five cars, three circuits, and a hand-written WebGL renderer. The whole game is static HTML, CSS and JavaScript, with no build step and no dependencies.

## Run it

Serve the folder with any static server, then open the page in a modern browser:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Throttle |
| S / ↓ | Brake |
| A / D or ← / → | Steer |
| Space | Handbrake |
| R | Respawn |
| M | Mute |
| Esc | Pause |

## Layout

* `index.html`: page and HUD.
* `js/`: game code, split by concern (`game.js`, `physics.js`, `ai.js`, `cars.js`, `tracks.js`, `world.js`, `audio.js`, `webgl.js`).
* `css/style.css`: styles.
* `test/`: test and debugging scripts. Some of them point to absolute paths on the original machine, so they won't run as-is.

## Licence

MIT. See [LICENSE](LICENSE).
