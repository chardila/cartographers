# AGENTS.md

Guidance for agentic coding assistants in this repository.

## Project Overview

Vite-based web app for tracking scores in "Cartographers" board game. Uses Firebase Realtime Database for multiplayer. Codebase uses ES5-style patterns with global namespaces, modernized with Vite and ES Modules.

## Build & Development Commands

```bash
npm run dev      # Start dev server (default: http://localhost:3000, may use 3001+ if busy)
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on src/ directory (note: config needed)
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in Firebase credentials
3. For production, credentials are GitHub Actions secrets

### Testing

**No automated tests.** Do not create test files unless explicitly requested.

### Lint Configuration

`npm run lint` fails due to missing ESLint configuration (ESLint v9+ requires `eslint.config.js`). To fix:

```bash
npm init @eslint/config
# Select: JavaScript, CommonJS, No framework, No TypeScript
# Or create minimal config manually
```

### Code Formatting

Prettier is installed but not configured. Use `npx prettier --write .` if needed.

## Code Style Guidelines

### Architecture & File Organization

- **ES5-style JavaScript** with `'use strict'` for core game logic
- **ES6 Modules** only for imports in `src/main.js`
- **Global namespace pattern** on `window`:
  - `window.constants` - game constants
  - `window.methods` - organized functionality (UX, network, DB)
  - `window.uxState` - current UI state
- External libraries as globals: `firebase`, `ISpin`, `Fingerprint2`
- **Script loading order** (`src/main.js`):
  1. `nano.js` - DOM query utility
  2. `ispin.js` - number spinner library
  3. `tostada.js` - utility functions
  4. `app-local.js` - board rendering, local scoring (~1200 lines)
  5. `app-opponents.js` - opponent board views
  6. `app-db.js` - Firebase integration
  7. `app.js` - main orchestration

### JavaScript Conventions

- **Module Pattern**: Use IIFE with `'use strict'`: `(function() { 'use strict'; ... })();`
- **Variables**: Use `var` (not `let`/`const`) for ES5 consistency, camelCase names
- **Constants**: UPPER_SNAKE_CASE: `LOCAL_PLAYER_DEFAULT_ID`, `EMPTY_DATA_STRING`
- **Functions**: Function expressions, not arrow functions. Attach to namespaces: `UX.updateAllBoards = function(player) {...}`
- **Error Handling**: Use `console.log()` (with `window.DEBUG` checks). Check for null/undefined: `if (!board) return;`
- **DOM Manipulation**: Use `nano.js` (`$()` and `nanoAll()`). Cache DOM references.
- **Import/Export**: ES6 imports only in `src/main.js`. No ES6 exports in game logic; share via global `window` object.

### Naming Conventions

- **Variables/Functions**: camelCase: `localPlayerName`, `updateOpponentData`
- **CSS Classes/IDs**: kebab-case: `game-container`, `featured-board-modal`
- **Global Namespaces**: lowercase: `methods`, `uxState`, `constants`. Uppercase sub-namespaces: `methods.UX`, `methods.DB`

### CSS Conventions

- Use `vmin` units for responsive scaling: `width: 10vmin; height: 10vmin;`
- Mobile-first responsive design with media queries at `800px`
- Classes use kebab-case: `.join-game-controls`, `.terrain-wrap`
- Colors in `rgb()` format: `rgb(255, 255, 255)`
- Box model: Use `box-sizing: border-box` for consistent sizing

### Firebase Integration

- **Database**: Games at `/games/{gameId}`, Players at `/players/{playerId}`
- **Security**: Never commit `.env`. Use env vars (GitHub Actions secrets). Reference with `import.meta.env.VITE_*`

## Deployment

- **GitHub Pages**: Automated via `.github/workflows/deploy.yml`. Builds on push to `master`, deploys `dist/`
- **Vite Config**: Root `.`, output `dist/`, port `3000`, base path `/`

## Agent Guidelines

### When Making Changes

1. **Follow existing patterns** - Mimic ES5 style and global namespace
2. **Maintain script loading order** - Don't change import order in `src/main.js`
3. **Use existing utilities** - Prefer `nano.js` over raw `document.querySelector`
4. **Check CLAUDE.md** - Additional architectural context
5. **Run verification steps** after changes

### What to Avoid

1. **Don't introduce ES6+ features** in core game logic (no arrow functions, `let`/`const`, classes)
2. **Don't add automated tests** unless explicitly requested
3. **Don't change global namespace structure** without good reason
4. **Don't commit `.env` files** or hardcode Firebase credentials
5. **Don't modify third-party libraries** (`ispin.js`, `fingerprint2-min.js`) unless fixing bugs

### Verification Steps

After changes:

1. **Run `npm run build`** - Ensure production build succeeds
2. **Test manually in browser** with `npm run dev`
3. **Check console for errors** (with `window.DEBUG = true`)
4. **Verify responsive design** - Test at different viewport sizes
5. **Check Firebase integration** - Test multiplayer features work

## Cursor & Copilot Rules

No Cursor rules (`.cursor/rules/` or `.cursorrules`) or Copilot instructions (`.github/copilot-instructions.md`) present.

## File References

- `CLAUDE.md` - Architectural details and commands
- `README.md` - Project overview and setup
- `DEPLOYMENT.md` - Deployment troubleshooting
- `TROUBLESHOOTING.md` - Debugging guidance

## Example Code Pattern

```javascript
(function () {
  "use strict";
  var console = window.console;
  var $ = window.$; // nano.js
  var DEBUG = window.DEBUG;

  var methods = (window.methods = window.methods || {});
  var uxState = (window.uxState = window.uxState || {});
  var UX = (methods.UX = methods.UX || {});

  UX.updateAllBoards = function (player) {
    if (!player) return;
    // Implementation...
  };
})();
```
