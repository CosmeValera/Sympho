# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sympho is a static, serverless sheet-music editor: React 19 + TypeScript + Vite, engraving by VexFlow 5, playback by Tone.js. No backend; scores live in `localStorage`, share links carry the whole score in the URL, and the library can be exported/imported as a JSON file. Installable PWA that works offline. Deployed on Vercel; GitHub Actions (`.github/workflows/ci.yml`) runs lint, test and build on push and PR.

## Commands

Node.js 22+ (CI uses 24).

```sh
npm run dev                                  # Vite dev server, http://localhost:5173
npm test                                     # vitest run (all tests)
npx vitest run src/music/score.test.ts       # one test file
npx vitest run -t "playhead"                 # tests whose name matches
npm run lint                                 # oxlint (.oxlintrc.json)
npm run build                                # tsc -b type-check, then vite build into dist/ (plus sw.js and manifest)
npm run preview                              # serve dist/; the only way to exercise the service worker
```

`npm run build` is the only type-check; Vite's dev server and Vitest do not type-check. TS config is strict with `noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax` (type-only imports need `import type`) and `erasableSyntaxOnly` (no enums, namespaces or constructor parameter properties). Unused destructured fields are named `_x` (e.g. `{ id: _id, ...e }`).

## Architecture

Layers, from pure to impure: `src/music/` (framework-free engine, no DOM) → `src/render/` (VexFlow, DOM) and `src/audio/` (Tone.js) → `src/state/` (reducer, storage) → `src/components/` + `src/App.tsx`.

### Music engine (`src/music/`)

- Time is measured in **ticks, one tick = a 32nd note** (`TICKS_PER_WHOLE = 32`). Durations are `'1' | '2' | '4' | '8' | '16'` with `dots: 0 | 1`; dotted 16ths are disallowed (`canDot`). 6/8 is treated as compound (beat = dotted quarter) via `isCompound`/`beatTicks`.
- A `Score` is `measures[].events[]`, but edits never manipulate measures directly. The core pattern in `score.ts`: flatten the score to absolute-time `Segment`s (`toSegments`), modify the timeline, then re-bar with `buildMeasures`. `buildMeasures` fills gaps with rests, merges adjacent rests, splits notes across barlines into tied pieces using `decompose` (engraving rules for where values may start), and `fixTies` drops ties that no longer lead to the same pitch. This is why ties, rests and meter changes (`setTimeSignature`) stay consistent. New edit operations should go through `writeSegment`/`buildMeasures` rather than splicing events.
- Event ids survive re-barring only for the first piece of a segment (`seg.id`); split-off pieces get `newId()`. Edit functions return `EditResult { score, selectedId, cursor? }` and use `result()` to fall back to whatever now occupies the tick if the selected id was merged away. `cursor` says where typing continues: `writeSegment` sets it to the segment's end (a written rest merges into the gap, so the selection can't say where it ended) and `toRest` to where the note was.
- `parse.ts` has a compact text notation used by `examples.ts` and the tests: `C5:4` quarter C5, `F#4:8.` dotted eighth, `r:2` half rest, `G4:2~` tied, `C4+E4+G4:2` chord; `|` is ignored (barring comes from the time signature). Tests in `score.test.ts` build scores with it and assert via a `notation()` helper that renders back to the same format.
- `serialize.ts` `readScore` is the validator for all untrusted JSON (localStorage, share links): it clamps fields, only accepts time signatures in `TIME_SIGNATURES` and keys in `KEY_SIGNATURES`, and re-bars from scratch. Share links (`encodeShare`) strip event ids and are lz-string compressed; `decodeShare` gives the score a fresh id so it never overwrites the recipient's copy. Adding a meter or key means adding it to those lists (key ids are VexFlow key specs).
- Chords: a note has `pitches` (lowest first, at most one per staff position: always build them with `chordOf`); a single note is a one-pitch chord. Saves from before chords have a single `pitch`, which `readScore` still reads. Edits to one note of a chord take a `head` (its diatonic index; `headOf` falls back to the top note) and return the new one in `EditResult.head`: `moveSteps` steps over the chord's other notes, `setAlter` changes only the head, `addPitch` adds a note, `removeNote` removes the head (a last note becomes a rest). A tie carries only the pitches the two chords share (`sharesPitch`), and `fixTies` drops it when they share none. `soundingNotes` flattens the score into what is actually heard (a tied pitch sounds once), used by playback and MIDI export.
- Pitch: `{ step, octave, alter }`, editor range G3–C7 (`clampDiatonic`). A typed letter goes to the octave `nearestPitch` picks: closest to the previous note, with ledger-line steps costing extra so runs don't drift off the staff. Instrument `transpose` (guitar −12, bass −24) is applied only at sound time, in `audio/player.ts` and `audio/midi.ts`; written pitch is unchanged.

### State (`src/state/`)

- `editor.ts` reducer. Music changes are dispatched as `{ type: 'edit', label, edit: (score, selectedId) => EditResult | Score, written? }`. An undo step is recorded only if the returned score is a **new object**, so no-op edits must return the same `score` reference (`moveSteps`/`setAlter` do this at the range limits). History entries are `Snapshot { score, cursor, label }`, so undo puts the caret back too; `label` is a lower-case phrase ("write F♯5 quarter") shown in the Undo/Redo tooltips and the "Undid: …" toast. `meta` (title/composer) bypasses undo on purpose, and undo/redo keep the current title and composer.
- A **picked** note (clicked, or reached with ←/→) syncs `duration`/`dots` to it, and value keys change it. A **written** note (`written: true`, set by edits that write one, kept by later edits to the same selection) does neither: value keys set the next note's value, and the playhead stays put. The `duration` action clears `dots` unless it passes them.
- `persisted` flag: examples and shared links load as drafts (`persisted: false`) and become library scores on first edit (or title/composer change), taking `saveAs` as their title so they can't be mistaken for the original (`titles.ts` `uniqueTitle`: "Ode to Joy (copy)", "Untitled score 2"). Drafts open in the Select tool; your own or blank scores open in Write. With no last-opened score (first visit), `initialEditor` in `App.tsx` starts a blank draft. `App.tsx` saves to `localStorage` on every change once persisted and replaces the `#/s/…` / `#/example/…` hash with `#/`.
- `storage.ts` wraps every `localStorage` access in try/catch; keys are prefixed `sympho:`.
- `head` is the picked note of a selected chord (diatonic index): arrows, accidentals and Del act on it, Alt ↑/↓ moves it (`head` action), Shift+A–G adds a note above it (`pitchAbove`), and edits follow `EditResult.head`. Clicking above/below a note in Write mode adds to the chord (`StaffHit.addTo`); clicking near one of its noteheads selects that note.
- `tool: 'select' | 'write'` is the click mode; there is no rest mode, since rests are the gaps between notes. `Editor.tsx` sets `data-tool` on `<main class="editor">` and CSS keys the mode cues off it (tinted, ringed paper and a coloured status-bar chip in Write). Typing A–G or R switches to Write.
- `cursor` is the caret tick, where A–G, R and the toolbar rest button write (`write()` in `Editor.tsx`). Selecting moves it via `entryTick` (after a selected note, at the start of a selected rest); an edit's `EditResult.cursor` moves it; otherwise it stays, clamped to `scoreTicks`. Selecting a rest keeps `duration`, so the value being typed survives. Shown by `Caret` in `ScoreView.tsx` as a shaded slot as wide as the next note of the current value, and only while typing: `Editor.tsx` `typing` turns on with A–G, R, the rest button or ←/→ and off with a staff click, Esc or play. Hidden, `cursor` is passed as `null` to `ScoreView` and `StatusBar` (no "Writes at"), so by default only the orange playback line is on the staff.
- `playhead` is the tick playback starts from: it follows a picked selection (`withSelection`) but not notes as they're written, and `seek` snaps it to the start of the event under it (`eventStart`). Caret, playhead, picked/written and drafts are covered by `editor.test.ts`.
- `backup.ts` is the library file format (`{ app: 'sympho', version: 1, scores }`). `mergeBackup` accepts that, a bare array or one score, validates each with `readScore`, and only replaces a score with a newer `updatedAt`. `storage.replaceLibrary` writes the merged result.

### Rendering (`src/render/`)

- `renderScore` imperatively engraves into a container (SVG backend) and returns a `ScoreLayout` (measure/event boxes in layout units plus `scale`) used by `ScoreView` for hit-testing clicks and positioning the ghost note. It adds a faint "ghost" measure when editable. The pure layout maths is in `layout.ts` (tested in `layout.test.ts`): `naturalWidth` estimates a bar's width, `breakRows` breaks greedily into rows that are then stretched or squeezed to the width, and `fitScale` lowers the preferred scale (`ScoreView` `scaleFor`, by container width) until the widest bar fits a row on its own, down to `MIN_SCALE`. So a phone gets at least one bar per row and the SVG is never wider than its container.
- Each VexFlow note gets the event id, so the SVG element id is `vf-<eventId>`; `ScoreView` toggles `is-selected` / `is-playing` / `is-hover` classes on those elements instead of re-rendering. Chord noteheads get `vf-<headId(eventId, line)>`, and the picked one `is-head` (the others fade).
- `EventBox.left` is a note's left edge including its accidental; the playback marker (`Playhead` in `ScoreView.tsx`) is drawn just before it. Dragging the marker snaps to event starts (`snapTick`) and calls `onSeek` only if it moved; `swallowClick` stops the click that ends a drag from writing a note.
- Glyphs in TSX (noteheads, rests, toolbar note values) are SMuFL Private Use Area characters rendered with Bravura. Some editing tools silently strip PUA characters, so write them as `\uXXXX` escapes.
- All strokes/fills use `currentColor` so CSS themes (`data-theme` = light/dark/solar on `<html>`) apply. VexFlow is imported from `vexflow/core` with fonts from `@vexflow-fonts/*`; `loadMusicFonts()` must resolve before rendering or glyphs are mis-measured.
- `exportSvg.ts` embeds the woff2 fonts as data URLs so exported SVGs render elsewhere.

### Audio (`src/audio/`)

`player` is a singleton that lazy-imports Tone.js on first sound (largest dependency). Piano uses Salamander samples from `tonejs.github.io` with a synth fallback if the CDN fails; the monophonic guitar and bass synths are round-robin pools (`pool`) so chords sound, and a limiter on the output keeps chords from clipping. MIDI export (`midi.ts`) and SVG export are dynamically imported from `Editor.tsx`. `player.play` bumps a run counter so draw callbacks from a stopped run are ignored.

Playback model in `Editor.tsx`: `sounding` (non-null while playing) holds the event being heard, and the marker shown is `sounding?.tick ?? playhead`. `playFrom(tick)` does not move the reducer playhead, so when the piece ends the marker returns to where it was. Pausing (`Space`) seeks the playhead to the sounding tick, so the next `Space` resumes there. `Shift Space` is `playFrom(0)`; `Home` and the toolbar button seek to 0. Seeking or selecting while playing restarts from the new tick, and any music edit (`change()`) pauses.

### App shell

Hash routing in `App.tsx`: `#/` editor, `#/library`, `#/example/<slug>`, `#/s/<data>`. Keyboard shortcuts live in `Editor.tsx` `onKeyDown`; the user-facing lists are `ShortcutsDialog.tsx` and the hints in `StatusBar.tsx` (what a click does in the current tool, or how to edit the selection), so keep all three in sync. `vite.config.ts` splits vexflow and react into their own chunks and configures `vite-plugin-pwa`: Workbox precaches the build (including the woff2 music fonts) and caches the Salamander piano samples CacheFirst. PWA icons in `public/icons/` were rendered from `public/favicon.svg`.

Phones (`@media (max-width: 640px)` in `App.css`): the toolbar is `position: fixed` at the bottom in three rows (reordered with flex `order`), `.editor` reserves `--dock-height` under the score, and `.app` clips horizontal overflow. `ScoreView` `reveal()` scrolls a selection into the space between the header and the docked toolbar. Touch (`useMediaQuery('(pointer: coarse)')` in `Editor.tsx`, passed to `StatusBar` as `touch` so the hints talk about taps): in Write mode a finger held still for `AIM_DELAY` starts aiming, the ghost and a lifted pitch label follow it, and letting go writes there; moving more than `AIM_SLOP` first scrolls instead. A quick tap on a note's column selects its nearest notehead rather than adding to the chord (`toHit(e, tap)`); holding above or below adds one.
