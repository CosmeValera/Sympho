# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sympho is a static, serverless sheet-music editor: React 19 + TypeScript + Vite, engraving by VexFlow 5, playback by Tone.js. No backend; scores live in `localStorage` and share links carry the whole score in the URL. Deployed on Vercel.

## Commands

Node.js 20+.

```sh
npm run dev                                  # Vite dev server, http://localhost:5173
npm test                                     # vitest run (all tests)
npx vitest run src/music/score.test.ts       # one test file
npx vitest run -t "click modes"              # tests whose name matches
npm run lint                                 # oxlint (.oxlintrc.json)
npm run build                                # tsc -b type-check, then vite build into dist/
```

`npm run build` is the only type-check; Vite's dev server and Vitest do not type-check. TS config is strict with `noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax` (type-only imports need `import type`) and `erasableSyntaxOnly` (no enums, namespaces or constructor parameter properties). Unused destructured fields are named `_x` (e.g. `{ id: _id, ...e }`).

## Architecture

Layers, from pure to impure: `src/music/` (framework-free engine, no DOM) → `src/render/` (VexFlow, DOM) and `src/audio/` (Tone.js) → `src/state/` (reducer, storage) → `src/components/` + `src/App.tsx`.

### Music engine (`src/music/`)

- Time is measured in **ticks, one tick = a 32nd note** (`TICKS_PER_WHOLE = 32`). Durations are `'1' | '2' | '4' | '8' | '16'` with `dots: 0 | 1`; dotted 16ths are disallowed (`canDot`). 6/8 is treated as compound (beat = dotted quarter) via `isCompound`/`beatTicks`.
- A `Score` is `measures[].events[]`, but edits never manipulate measures directly. The core pattern in `score.ts`: flatten the score to absolute-time `Segment`s (`toSegments`), modify the timeline, then re-bar with `buildMeasures`. `buildMeasures` fills gaps with rests, merges adjacent rests, splits notes across barlines into tied pieces using `decompose` (engraving rules for where values may start), and `fixTies` drops ties that no longer lead to the same pitch. This is why ties, rests and meter changes (`setTimeSignature`) stay consistent. New edit operations should go through `writeSegment`/`buildMeasures` rather than splicing events.
- Event ids survive re-barring only for the first piece of a segment (`seg.id`); split-off pieces get `newId()`. Edit functions return `EditResult { score, selectedId }` and use `result()` to fall back to whatever now occupies the tick if the selected id was merged away.
- `parse.ts` has a compact text notation used by `examples.ts` and the tests: `C5:4` quarter C5, `F#4:8.` dotted eighth, `r:2` half rest, `G4:2~` tied; `|` is ignored (barring comes from the time signature). Tests in `score.test.ts` build scores with it and assert via a `notation()` helper that renders back to the same format.
- `serialize.ts` `readScore` is the validator for all untrusted JSON (localStorage, share links): it clamps fields, only accepts time signatures in `TIME_SIGNATURES` and keys in `KEY_SIGNATURES`, and re-bars from scratch. Share links (`encodeShare`) strip event ids and are lz-string compressed; `decodeShare` gives the score a fresh id so it never overwrites the recipient's copy. Adding a meter or key means adding it to those lists (key ids are VexFlow key specs).
- Pitch: `{ step, octave, alter }`, editor range G3–C7 (`clampDiatonic`). Instrument `transpose` (guitar −12, bass −24) is applied only at sound time, in `audio/player.ts` and `audio/midi.ts`; written pitch is unchanged.

### State (`src/state/`)

- `editor.ts` reducer. Music changes are dispatched as `{ type: 'edit', edit: (score, selectedId) => EditResult | Score }`. An undo step is recorded only if the returned score is a **new object**, so no-op edits must return the same `score` reference. `meta` (title/composer) bypasses undo on purpose.
- `persisted` flag: examples and shared links load as drafts (`persisted: false`) and become library scores on first edit. `App.tsx` saves to `localStorage` on every change once persisted and replaces the `#/s/…` / `#/example/…` hash with `#/`.
- `storage.ts` wraps every `localStorage` access in try/catch; keys are prefixed `sympho:`.
- `restMode` and `selectMode` are mutually exclusive click modes (covered by `editor.test.ts`).

### Rendering (`src/render/`)

- `renderScore` imperatively engraves into a container (SVG backend) and returns a `ScoreLayout` (measure/event boxes in layout units plus `scale`) used by `ScoreView` for hit-testing clicks and positioning the ghost note. It does its own greedy line breaking and adds a faint "ghost" measure when editable.
- Each VexFlow note gets the event id, so the SVG element id is `vf-<eventId>`; `ScoreView` toggles `is-selected` / `is-playing` / `is-hover` classes on those elements instead of re-rendering.
- All strokes/fills use `currentColor` so CSS themes (`data-theme` = light/dark/solar on `<html>`) apply. VexFlow is imported from `vexflow/core` with fonts from `@vexflow-fonts/*`; `loadMusicFonts()` must resolve before rendering or glyphs are mis-measured.
- `exportSvg.ts` embeds the woff2 fonts as data URLs so exported SVGs render elsewhere.

### Audio (`src/audio/`)

`player` is a singleton that lazy-imports Tone.js on first sound (largest dependency). Piano uses Salamander samples from `tonejs.github.io` with a synth fallback if the CDN fails. MIDI export (`midi.ts`) and SVG export are dynamically imported from `Editor.tsx`. Any music edit while playing stops playback (`change()` in `Editor.tsx`).

### App shell

Hash routing in `App.tsx`: `#/` editor, `#/library`, `#/example/<slug>`, `#/s/<data>`. Keyboard shortcuts live in `Editor.tsx` `onKeyDown`; the user-facing list is `ShortcutsDialog.tsx`, so keep both in sync. `vite.config.ts` splits vexflow and react into their own chunks.
