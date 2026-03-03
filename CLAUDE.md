# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on src/
```

There are no automated tests in this project.

## Environment Setup

Firebase credentials are required. Copy `.env.example` to `.env` and fill in your Firebase project values. For production, these are injected as GitHub Actions secrets during CI/CD.

## Architecture

This is a Vite-based web app for tracking scores in the board game "Cartographers". It uses Firebase Realtime Database for multiplayer features.

### Script Loading Order (src/main.js)

Scripts are imported in dependency order:
1. `nano.js` — lightweight DOM query utility (`nano()`, `nanoAll()`)
2. `ispin.js` — number spinner input library (3rd-party, modified)
3. `tostada.js` — utility functions
4. `app-local.js` — local game state, DOM collection, board rendering (~1200 lines)
5. `app-opponents.js` — multiplayer/network UI logic
6. `app-db.js` — Firebase integration layer
7. `app.js` — main orchestration; initializes and wires everything together

### Global State Pattern

The codebase uses ES5-style global namespaces on `window`:
- `window.constants` — game constants (terrain types, scoring rules, etc.)
- `window.uxState` — current UI state (selected terrain, current board, player list, etc.)
- `window.methods` — organized by sub-namespace:
  - `methods.UX` — UI rendering and updates
  - `methods.network` — Firebase read/write operations
  - `methods.DB` — database helpers

External libraries are also globals: `firebase`, `ISpin`, `Fingerprint2`.

### Key Files

- `index.html` — all HTML structure (modal panels, game board, score UI)
- `src/js/app.js` — event wiring, initialization, game flow control
- `src/js/app-local.js` — board cell rendering, local scoring, DOM state
- `src/js/app-opponents.js` — opponent board views, monster placement for opponents
- `src/js/app-db.js` — Firebase read/write with `methods.DB` and `methods.network`
- `src/style/style.css` — main styles; board uses `vmin` units
- `src/style/style-players.css` — multiplayer-specific styles

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds on push to `master` and deploys `dist/` to GitHub Pages. The Vite base path is `/` (set in `vite.config.js`) to support custom domains.
