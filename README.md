# Sympho

[![CI](https://github.com/CosmeValera/Sympho/actions/workflows/ci.yml/badge.svg)](https://github.com/CosmeValera/Sympho/actions/workflows/ci.yml)

Write sheet music in the browser, hear it played back, and share it with a link. There's nothing to install and no account to make, and it keeps working offline.

**Live:** [sympho.cosmevalera.dev](https://sympho.cosmevalera.dev)

![The Sympho editor: Minuet in G with a note selected and the orange playback marker before it](docs/screenshot.png)

## Features

- **Write or select, never both by accident.** A switch in the toolbar sets what a click does. **Notes** (`W`) and **Rests** (`Shift R`) write where you click, with a ghost note that previews the pitch. **Select** (`S`) only picks notes, ready for sharps, flats, dots and ties. A status line under the toolbar says what a click will do right now, or what's selected and which keys edit it.
- **A playback marker you can see and drag.** The orange marker shows where playback starts. Drag it anywhere, or select a note to move it there. `Space` pauses and resumes from where it stopped, `Shift Space` plays from the top without losing your place, and `Home` moves the marker back to the start.
- **Keyboard entry.** Type `A`–`G` to add notes, `R` for a rest, `1`–`5` for values, `+`/`-` for accidentals, and arrows to move around. Press `?` in the app for the full list.
- **Correct notation.** Notes that cross a barline are split and tied, gaps fill with rests, and 6/8 groups in dotted quarters. Engraving is done by [VexFlow](https://www.vexflow.com/).
- **Playback** with sampled piano, flute, guitar and synth bass ([Tone.js](https://tonejs.github.io/)). The note that's sounding is highlighted, and the marker follows it.
- **Library.** Scores save automatically in your browser, with thumbnails, duplicate and delete. **Export** the library to a JSON file as a backup or to move it to another device, and **Import** it back. Importing merges, and never replaces a score with an older copy.
- **Share links.** The whole score is compressed into the URL, so sharing needs no server.
- **Export** to MIDI, or SVG with the music fonts embedded.
- **Installable and offline.** It's a PWA: install it from the browser and it works without a connection. The piano samples are cached the first time you hear them.
- **Undo/redo**, light, dark and solarized themes, and a layout that works on phones.

## How it works

- `src/music/` is a framework-free engine. A score is a list of measures of events, timed in 32nd-note ticks. Every edit flattens the music into a timeline, writes into it, and re-bars it, which is how ties, rests and meter changes stay consistent.
- `src/render/` draws a score with VexFlow into SVG and returns a layout map. The editor uses it to hit-test clicks, place the ghost note, and position and snap the playback marker.
- `src/audio/` schedules playback on the Tone.js transport. Tone.js loads lazily on the first sound, and MIDI export also loads on demand.
- `src/state/` holds the editor reducer (with undo history), `localStorage` persistence, and the library backup format.
- Routing uses the URL hash (`#/library`, `#/example/<slug>`, `#/s/<data>`), so any static host works. A Workbox service worker (via `vite-plugin-pwa`) precaches the build.
- GitHub Actions runs lint, tests and a production build on every push and pull request.

Stack: React 19, TypeScript, Vite, VexFlow 5, Tone.js, Vitest, oxlint. Deployed on Vercel.

### Why there's no backend

A score is a few kilobytes of JSON. Keeping it in the browser makes the app instant, free to host and private by default. Share links carry the whole score in the URL, and file export covers backups and moving between devices. Accounts and sync can be added later behind the same storage functions in `src/state/storage.ts` if the app ever needs them.

## Development

Requires Node.js 22 or newer.

```sh
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest: music engine, editor reducer, backups
npm run lint      # oxlint
npm run build     # type-check and build into dist/
npm run preview   # serve the build, with the service worker
```

## History

Sympho started as a team project by [Cosme Valera](https://github.com/CosmeValera) and [p-jgomariz](https://github.com/p-jgomariz). It was an Electron desktop app in vanilla JS with Google sign-in, an Express and MongoDB API, and Kubernetes deployment with Flux and Helm.

Version 2 rewrites it as a static React and TypeScript web app. The desktop shell, the API and the cluster were dropped on purpose. A PWA covers what Electron did (an installable app that works offline), and a static site on Vercel doesn't need servers or a database to run. The original code is in the git history. Triplets from the original aren't ported yet.
