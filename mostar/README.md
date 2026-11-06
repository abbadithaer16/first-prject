# Mostar city

A four-page visitor guide to Mostar, written in plain HTML, CSS and JavaScript with no build step. Photographs and the Ogg Medium font load from `motionsites.org`, so the pages need an internet connection.

| Page | File | What's on it |
|---|---|---|
| Intro | `index.html` | The cinematic scroll story, then links to the other pages |
| Bridge | `bridge.html` | Stari Most: a scroll-driven timeline from 1557 to 2005, the divers, viewpoints |
| Bazaar | `bazaar.html` | Old town stops, food and drink, old town notes (`#notes`) |
| Routes | `routes.html` | The old town walk, a day-trip map, getting here, seasons, practical notes |

- `styles.css` and `script.js`: the home page's cinematic stage only.
- `site.css` and `site.js`: shared by every page (header, language menu, footer, inner pages, hero parallax, timeline, day-trip map).
- `preview/`: screenshots and a scroll recording.

## Run it

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk also works.

Travel details (opening hours, fees, timetables, swimming rules) change often. Check them before relying on the guide.
