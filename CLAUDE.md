# Playbook — V2 (formerly FbPlaybook.js)

## What this project is

`FbPlaybook.js` is a small front-end JavaScript library originally written as a school project. The pitch: a developer drops the library into a webpage and gets two reusable widgets for working with American Football plays —

1. **`playBook`** — a flippable two-page "book" UI that holds a collection of plays. Each page shows an image of a play, its title, and (optionally) a link to a video. End users can flip forward/back and, when configured, save their own custom plays to the book.
2. **`PlayDisplayer`** — a top-down rendering of an 11-player offensive formation (LTE, LT, LG, C, RG, RT, RTE, QB, LHB, FB, RHB) on a green field. The developer can assign each position a named "move" from a fixed catalog (e.g. `'deep-90-right'`, `'pass-qb'`, `'hole-four-fb'`); pressing **Play Animation** triggers jQuery `.animate()` calls that slide the player divs along the chosen routes. A "sandbox" dropdown UI lets end users pick moves themselves.

A `PlayDisplayer` can be passed into a `playBook`, which wires the two together: each saved page records a move list, and clicking **Initialize Play** on a page loads those moves back into the displayer so the user can replay the animation.

## Why V2 exists

The original (in `C:\Coding\Playbook.js`) was an alpha release graded on functionality and presentation. The TA's [alpha_feedback.md](alpha_feedback.md) flagged that the animation/play-creation core was only partially implemented and that the example/UI presentation was rough. This V2 is a clean slate to:

- **Modernize the UI** (primary goal) — the current look is dated: lightslategrey + green hardcoded palette, oversized fonts, fixed-pixel widths that don't respond to screen size.
- **Clean up the code** — the library is one ~1330-line IIFE with heavy duplication (11 nearly identical `setXxxMove` methods, two near-identical `getValidMoveList` functions for `xx-large` vs `large` sizing, a giant inline form builder, etc.).
- **Possibly extend features** — open-ended; could include defensive formations, more move types, persistence, export, animation tweening improvements, etc.

## Current layout

```
Playbook.js-V2/
├── server.js                 # Minimal Express static-file server (port 5000)
├── package.json              # Only dep: express ^4.16.4
├── README.md                 # Old README with Heroku links (dead — Heroku free tier is gone)
├── alpha_feedback.md         # TA feedback from the original alpha submission
└── (pub/ removed)            # V1's original source (FbPlaybook.js, the demo HTML
                              # pages, FbPlaybook.css) lived here. Removed in the V2
                              # cleanup; preserved in the V1 repo
                              # (github.com/connorburns19/Playbook.js) and in this
                              # repo's git history at import commit e71bce4.
```

> Note: the "Current layout", "How it currently works", and "Known smells"
> sections below describe the **V1 baseline** that V2 was built from — kept as
> reference for the modernization. The live V2 codebase is `src/` (library),
> `demo/` (Vite demos), and `tests/`.

## How it currently works (key implementation notes)

- **Module style:** Single IIFE `(function(global, document, $) { ... })(window, window.document, $)` that attaches `playBook` and `PlayDisplayer` to `window`. No ES modules, no bundler.
- **Dependency:** jQuery 3.5.1 (loaded from Google CDN in the HTML files). Animations use `$(el).animate({top/bottom/left/right: px}, speed)`.
- **Sizes:** The displayer has two real sizes, `'large'` and `'xx-large'`, each with its own hard-coded pixel offsets in a duplicated move catalog. A half-broken `'x-large'` path exists (typo'd class names like `playe-x-large`).
- **State:** Each `PlayDisplayer` instance stores 11 pairs of `<position>move` (array of animation steps) + `<position>name` (string id of the move) — a lot of parallel fields.
- **Wiring books to displayers:** When a `playBook` is constructed with a `field` (a `PlayDisplayer`) and `bool=true` (allow-save), a "Save Custom Play" button is appended to the book's task bar. Clicking it reads the displayer's current per-position move names and calls `this.addPage(...)` with a placeholder grey image.
- **Server:** `server.js` is a 40-line Express app that just serves `/pub` as static, plus a root route that prints a "go to landingpage.html" message and a sample `/problem` 500 route.

## Known smells / things ripe for cleanup

These aren't a fix-list — just things to be aware of when editing:

- **Repetition:** `setLTEMove`, `setLTMove`, ..., `setRHBMove` are 11 copies of the same 4 lines. Similar 11-way repetition in the book's save handler and in `addPage`'s "Initialize Play" handler.
- **Two move catalogs** (`getValidMoveList` and `getValidMoveListLarge`) differ only in pixel constants — should be one catalog parameterized by field dimensions.
- **CSS is dated** — fixed widths (`854px`, `1220px`), `border-radius: 10%` on rectangles, an empty `.center {}` rule, several unused/empty classes, color choices (lightslategrey, thistle, rgb(216,175,99)) that don't read as modern.
- **Bugs to watch for:** the `pass-qb` move is referenced as `'pass-1b'` in some V1 demo data (`landingpage.js` / `examples.js`, in the V1 repo) — that's a typo, not a real move. The `examples.js` `new playBook("", null, 'yuh')` call passes `'yuh'` as the `bool` arg, not `parentid`. The save-button click handler in `playBook` reads `this.field.ltemove[0]` then immediately overwrites `lte` with the *name*, which makes the "is move defined?" check work backwards from what the variable name suggests.
- **HTML duplication:** `landingpage.html` has many empty `<div class='code'></div>` placeholders and inline content that would be cleaner as a templated structure.
- **`examples.html`** is essentially abandoned (one paragraph of text + a `<div id='yuh'>`).
- **Dead links:** README and documentation link to `fbplaybooksample.herokuapp.com`, which no longer resolves.

## Running it

```
npm install
npm start          # node server.js — listens on http://localhost:5000
```

Then open <http://localhost:5000/landingpage.html>.

## Modernization plan

The phased roadmap lives in [PLAN.md](PLAN.md) — open that file to see the current status, exit criteria per phase, and open questions. Status checkboxes in `PLAN.md` are the source of truth for where work picks up across sessions.

### Locked technical decisions

These are settled — don't relitigate without updating both files:

- **Language:** TypeScript, strict mode (zero `any`)
- **Library build:** `tsup` → ESM + CJS + `.d.ts`
- **Playground build:** Vite
- **Animation:** Web Animations API (no jQuery). Chosen for: bundle size (~30KB → ~4KB total), the `Animation` object return value (enables pause/seek/scrubber features), and "lightweight" pitch consistency.
- **Editor in playground:** CodeMirror 6 (lighter than Monaco, ~100KB vs ~2MB)
- **Tests:** Vitest, focused coverage on `moves.ts` + core classes
- **License:** MIT
- **Brand:** Renamed `FbPlaybook` / `playBook` → `Playbook` (PascalCase) throughout V2 code. `PlayDisplayer` keeps its name. V1 source lives in the [original V1 repo](https://github.com/connorburns19/Playbook.js) and is preserved in this repo's git history at the `e71bce4` import commit.
- **Package name:** `@connorburns/playbook`
- **Hosting:** Demo + docs embedded as routes in the Next.js portfolio. V2 stays a standalone repo (not pulled into the portfolio as a workspace).
- **Docs approach:** The **playground IS the primary docs surface** — curated preset snippets organized as a tutorial sidebar (Getting started → PlayDisplayer → Connected playbook + field → Advanced). One supplementary `API.md` covers quick-reference signatures + the valid-moves table. No multi-page docs site.
- **Phase 5 extension feature:** JSON export/import of playbooks. Chosen because it pairs naturally with the playground (shareable demo URLs that load a saved playbook).
