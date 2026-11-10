# Formula One: a 3D presentation

A standalone, cinematic 3D slide presentation about Formula One. It has 13 slides in four chapters:

1. **History**: the first championship race at Silverstone in 1950, then eight eras marked on a 3D circuit.
2. **Teams and drivers**: repaint the car in five team colours, and see eight champions shown as columns sized by their titles.
3. **The race weekend**: a schedule with a car lapping the circuit, a qualifying knockout on the starting grid, and tyre compounds with the points system.
4. **Cars and technology**: an exploded car with markers you can select, the 2026 power unit, active aerodynamics (open and close the wings), safety and the halo.

It ends with a start-light sequence and a launch.

## Run it

Open `index.html` in a browser. There is no build step and no network dependency: three.js (r149), GSAP (3.12.5) and the Saira fonts are bundled in `vendor/` and `fonts/`, and everything loads as plain scripts, so it also works from `file://`.

To serve it instead:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

## Controls

| Action | Input |
|---|---|
| Next / previous | `→` `Space` `Page Down` / `←` `Page Up`, the arrow buttons, or swipe on touch screens |
| First / last slide | `Home` / `End` |
| Jump to a chapter | the chapter bar at the bottom |
| Fullscreen | `F` or the top-right button (hidden where the Fullscreen API is unavailable, e.g. iPhone Safari) |
| Shortcuts | `?` |

Every slide has its own URL (for example `#qualifying`), and the browser back button moves between slides.

## Notes

- **Accessibility**: the canvas is decorative. Everything it shows is also in the slide text, and the anatomy markers have matching buttons. Slide changes are announced through a polite live region, and inactive slides are `inert`. With `prefers-reduced-motion`, camera moves become cuts, idle motion stops, and the start sequence only shows the lights.
- **Fallback**: if WebGL is unavailable or the context is lost, the slides still work over a static background.
- **Performance**: the device pixel ratio is capped at 1.5 on touch and small screens and 2 elsewhere. There are no shadow maps (the car uses a blob shadow) and no post-processing, and all geometry is procedural, so no models are downloaded.
- **Facts**: the figures cover records up to the end of the 2024 season, plus the 2026 technical rules. They were written from established reference knowledge, not checked against live sources, so verify them before presenting publicly. Records that may change, such as current-season results, are deliberately left out. The car is a stylised model, and the team colours are impressions rather than official liveries. Both are labelled on screen.

## Licences

- three.js: MIT (`vendor/three-LICENSE.txt`)
- GSAP 3.12.5: GreenSock standard licence, free to use (header in `vendor/gsap-3.12.5.min.js`)
- Saira and Saira Condensed: SIL Open Font License 1.1 (`fonts/OFL.txt`)
