# Two-Column Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the UI into a two-column layout on wide screens (≥900px) so the game board and score cards are visible simultaneously without scrolling.

**Architecture:** On wide screens, a CSS Grid splits the page into a left column (~60%) with the terrain selector and board, and a right column (~40%) with gold coins and score cards. On narrow/portrait screens, the single-column layout is preserved but the board shrinks to fit the viewport so score cards are reachable with minimal scroll. All changes are CSS + minimal HTML restructuring — no JavaScript changes required.

**Tech Stack:** Plain HTML5, vanilla CSS3 (no preprocessors, no frameworks), Vite dev server. Dev command: `npm run dev` (serves at http://localhost:3000).

---

## Context: Project Structure

Before starting, understand the codebase layout:

```
cartographers/
├── index.html                  ← All HTML structure (single page)
├── src/
│   ├── main.js                 ← Entry point; imports all scripts in order
│   ├── style/
│   │   ├── style.css           ← Main styles (ONLY file we edit in CSS)
│   │   └── style-players.css   ← Multiplayer panel styles (DO NOT EDIT)
│   └── js/
│       ├── app-local.js        ← Board rendering (~1200 lines)
│       ├── app-opponents.js    ← Multiplayer board views
│       ├── app-db.js           ← Firebase integration
│       └── app.js              ← Main orchestration
└── vite.config.js
```

**Critical constraint:** There are NO automated tests. All verification is manual, using the browser at http://localhost:3000.

---

## Context: Current HTML Structure (inside `index.html`)

The relevant section of `index.html` (lines 69–153) currently looks like this:

```html
<div class="page-container" id="page-container-A">

    <!-- Position: absolute overlay, not in grid flow -->
    <div class="modal-panel-about" id="about-panel">...</div>

    <!-- Full-width title bar (dynamically filled by JS) -->
    <div class="title-wrap"></div>

    <!-- Terrain selector (contains JOIN button inside .join-game-controls) -->
    <div class="terrain-wrap" id="main-terrain-wrap">
        <div class="join-game-controls">...</div>
    </div>

    <!-- Game board (dynamically filled by JS) -->
    <div id="board-location"></div>

    <!-- Gold coins row (dynamically filled by JS) -->
    <div class="gold-coins-wrap" id="gold-coins-wrapper"></div>

    <!-- Score cards (dynamically filled by JS) -->
    <div class="score-cards-wrap" id="score-cards-section"></div>

</div>
```

**After our changes**, the structure becomes:

```html
<div class="page-container" id="page-container-A">

    <!-- Position: absolute overlay — stays here, not moved -->
    <div class="modal-panel-about" id="about-panel">...</div>

    <!-- Full-width title — stays here, gets grid-column: 1/-1 in CSS -->
    <div class="title-wrap"></div>

    <!-- NEW WRAPPER: left column on desktop -->
    <div class="col-board">
        <div class="terrain-wrap" id="main-terrain-wrap">
            <div class="join-game-controls">...</div>
        </div>
        <div id="board-location"></div>
    </div>

    <!-- NEW WRAPPER: right column on desktop -->
    <div class="col-scores">
        <div class="gold-coins-wrap" id="gold-coins-wrapper"></div>
        <div class="score-cards-wrap" id="score-cards-section"></div>
    </div>

</div>
```

---

## Context: Key CSS Numbers to Know

| Element | Current size | File/line |
|---------|-------------|-----------|
| `.board-wrap` | `90vmin × 90vmin` | style.css:812–818 |
| `.terrain-wrap` | `width: 84vw; height: 7vw` | style.css:437–447 |
| `.score-cards-wrap` padding-top | `5vw` | style.css:711 |
| `.score-card` width | `31%` (3 per row) | style.css:721–729 |
| `.page-container` | `display: flex; flex-wrap: wrap` | style.css:10–19 |
| `.title-wrap` | `width: 90vw` | style.css:21–30 |
| `.gold-coins-wrap` | `width: 90vw; max-width: 1120px` | style.css:486–493 |

---

## Context: CSS Media Query Pattern

The existing CSS uses ONE media query at the bottom of `style.css` (line 1147–1289):

```css
@media (pointer: coarse) {
    /* touch device overrides */
}
```

We will ADD a second media query for desktop two-column layout:

```css
@media (min-width: 900px) {
    /* two-column layout overrides */
}
```

**These two media queries are independent and do not conflict.**

---

## Task 1: Start Dev Server and Verify Baseline

**Purpose:** Confirm the current behavior before making changes.

**Files:** None (just running commands)

**Step 1: Install dependencies if needed**

```bash
cd /path/to/cartographers
npm install
```

Expected output: Package installs complete (or "up to date" if already installed)

**Step 2: Start the dev server**

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in XXX ms
  ➜  Local:   http://localhost:3000/
```

Keep this terminal running. Open http://localhost:3000 in a browser.

**Step 3: Verify the current problem**

In the browser at http://localhost:3000:
- On a desktop browser at full window size, you should see a large game board filling most of the screen
- Scroll down — the gold coins and score cards should be well below the fold
- This is the problem we are fixing

**No commit for this task.**

---

## Task 2: Add HTML Wrapper Divs

**Purpose:** Wrap the terrain+board in `.col-board` and coins+scores in `.col-scores`. These divs will become the grid columns in Task 3.

**Files:**
- Modify: `index.html:90–152`

**Step 1: Open `index.html` and locate the section to change**

Find the block starting at line 90 (the `<div class="terrain-wrap" id="main-terrain-wrap">` line) and ending at line 152 (`</div> <!-- END page-container -->`).

**Step 2: Replace the four sibling elements with two wrapped groups**

The current structure (simplified):
```html
<div class="terrain-wrap" id="main-terrain-wrap">
    ... (join game controls) ...
</div>

<div id="board-location"></div>

<div class="gold-coins-wrap" id="gold-coins-wrapper"></div>

<div class="score-cards-wrap" id="score-cards-section"></div>
```

Replace it with:
```html
<div class="col-board">
    <div class="terrain-wrap" id="main-terrain-wrap">
        ... (join game controls — copy exactly as-is) ...
    </div>

    <div id="board-location"></div>
</div>

<div class="col-scores">
    <div class="gold-coins-wrap" id="gold-coins-wrapper"></div>
    <div class="score-cards-wrap" id="score-cards-section"></div>
</div>
```

**Important:** Do NOT move or modify the `.modal-panel-about` div — it stays at the top of `.page-container` as-is. Do NOT move or modify `.title-wrap` — it stays where it is.

**Step 3: Verify the page still works (no visual breakage yet)**

In the browser (hot reload should trigger automatically):
- The page should look identical to before — `col-board` and `col-scores` are unstyled divs that don't affect layout yet
- The terrain selector, board, coins, and score cards should all still be visible
- Check that clicking terrain types, painting cells, and changing coin/score values still works

**Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: wrap board and score sections in col-board/col-scores divs"
```

---

## Task 3: Add Desktop Two-Column CSS

**Purpose:** On screens ≥900px wide, switch `.page-container` to a CSS Grid with the board on the left and scores on the right.

**Files:**
- Modify: `src/style/style.css` — append new section at the very end of the file (after line 1289)

**Step 1: Open `src/style/style.css`**

Scroll to the very end of the file (after the `@media (pointer: coarse) { ... }` block that ends around line 1289).

**Step 2: Append the following CSS block at the end of the file**

```css
/* ======= DESKTOP TWO-COLUMN LAYOUT (≥ 900px wide) ============= */

@media (min-width: 900px) {

    /* Switch page container to CSS Grid */
    .page-container {
        display: grid;
        grid-template-columns: 60fr 40fr;
        grid-template-rows: auto 1fr;
        align-items: start;
        column-gap: 0;
    }

    /* Title bar spans both columns */
    .title-wrap {
        grid-column: 1 / -1;
        width: 100%;
        padding: 1vw 2vw 2vw 3vw;
    }

    /* Left column: terrain selector + board */
    .col-board {
        grid-column: 1;
        grid-row: 2;
    }

    /* Right column: gold coins + score cards */
    .col-scores {
        grid-column: 2;
        grid-row: 2;
        padding: 0 2vw 0 1vw;
    }

    /* Terrain selector fills the left column width */
    .terrain-wrap {
        width: 100%;
        max-width: none;
        padding: 1.5vw 6px 1.5vw 1vw;
        height: 7vw;
        max-height: 90px;
    }

    /* Board: constrain to fit in viewport height.
       - 55vw: fills left column (which is 60% wide)
       - calc(100vh - 130px): leaves room for title (~60px) and terrain bar (~70px)
       Takes whichever is smaller so nothing overflows. */
    .board-wrap {
        width: min(55vw, calc(100vh - 130px));
        height: min(55vw, calc(100vh - 130px));
        padding: 2vmin 1vmin;
    }

    /* Gold coins: fill the right column */
    .gold-coins-wrap {
        width: 100%;
        max-width: none;
        padding: 1.5vw 1vw 1vw 0.5vw;
    }

    /* Score cards container: fill right column, no large top padding */
    .score-cards-wrap {
        width: 100%;
        max-width: none;
        padding: 2vw 0.5vw 0 0.5vw;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    /* Score cards: 2 per row in the right column */
    .score-card {
        width: 48%;
        height: 11vw;
        max-height: 137px;
        margin: 0 0 3vw 0;
    }

    /* Final score card: full width of right column */
    .final-score-card {
        width: 100%;
        margin: 0 0 2vw 0;
    }

}
```

**Step 3: Verify the two-column layout in the browser**

Resize the browser window to ≥ 900px wide and look for:
- ✅ The terrain selector and board are on the left
- ✅ The gold coins and score cards are on the right column
- ✅ The title/JOIN button spans the full width at the top
- ✅ The board and score cards are both visible without scrolling
- ✅ No elements are overlapping or hidden

**Step 4: Verify below the 900px breakpoint**

Resize the browser to < 900px wide:
- ✅ Layout reverts to single column (current behavior)
- ✅ Terrain selector, board, coins, scores stack vertically

**Step 5: Commit**

```bash
git add src/style/style.css
git commit -m "feat: add two-column desktop layout for wide screens (>=900px)"
```

---

## Task 4: Adaptive Board Size for Portrait/Mobile

**Purpose:** On portrait screens (narrow viewports), shrink the board so it doesn't push the score cards too far down. The target is to require at most one short scroll on mobile.

**Files:**
- Modify: `src/style/style.css:1180–1184` (inside the existing `@media (pointer: coarse)` block)

**Step 1: Find the existing mobile board-wrap rule**

In the `@media (pointer: coarse)` block (around line 1180), find:

```css
.board-wrap {
    padding: 4vw 0vw;
    width: 98vw;
    height: 98vw;
}
```

**Step 2: Change the board size to use `min()` to limit height**

Replace the board-wrap rule with:

```css
.board-wrap {
    padding: 4vw 0vw;
    width: min(98vw, calc(100vh - 260px));
    height: min(98vw, calc(100vh - 260px));
}
```

**Explanation of `calc(100vh - 260px)`:**
- `100vh` = full screen height
- `260px` = approximate space consumed by: title (~50px) + terrain bar (~100px) + gold coins (~60px) + some top score cards (~50px)
- This ensures the board never pushes score cards completely off-screen

**Step 3: Verify on a simulated phone in the browser**

Open DevTools → Toggle device toolbar → Select "iPhone 12 Pro" (390×844):
- ✅ The board is visible and reasonably sized
- ✅ The gold coins and first score cards are visible or just below the fold
- ✅ A small scroll reveals all score cards

Also verify on "iPad Mini" (768×1024, portrait):
- ✅ The board fits without taking up the entire screen
- ✅ Score cards are visible with minimal or no scroll

**Step 4: Commit**

```bash
git add src/style/style.css
git commit -m "fix: shrink board on portrait/touch devices to reduce score card scroll"
```

---

## Task 5: Verify Network/Multiplayer Panel Still Works

**Purpose:** The multiplayer panel (`.game-container`) slides in from the top when a player joins a game. We need to confirm it still works correctly with the new two-column layout.

**Context:** In `style.css` and `style-players.css`, the network panel logic uses CSS classes on `<body>`:
- `.network-game-active` → pushes `.page-container` down 6vw
- `.network-game-active.network-game-open` → pushes `.page-container` down 19vw

These `transform: translate(0, Xvw)` rules apply to `.page-container`. With our new grid layout, the grid still applies — the transform just shifts the whole grid down. This should work fine.

**Step 1: Test the JOIN button flow in the browser**

In the browser at http://localhost:3000 with a ≥900px window:
1. Click the "JOIN" button
2. The dropdown panel should appear (below the JOIN button in the left column)
3. The overall layout should not break

**Step 2: Simulate joining a game (visual check only)**

Open the browser console and run:
```javascript
document.body.classList.add('network-game-active');
```

Verify:
- ✅ The page container shifts down slightly (6vw)
- ✅ Both columns shift together (the grid as a whole moves)
- ✅ No column breaks or misalignment

Then run:
```javascript
document.body.classList.add('network-game-open');
```

Verify:
- ✅ The page container shifts down more (19vw total)
- ✅ The two-column layout is still intact below the network panel

To clean up:
```javascript
document.body.classList.remove('network-game-active', 'network-game-open');
```

**Step 3: Commit if any CSS fixes were needed**

If you made any adjustments to fix the network panel behavior:
```bash
git add src/style/style.css
git commit -m "fix: adjust page-container translate for network panel in two-column layout"
```

If no issues found, no commit needed.

---

## Task 6: Cross-Browser and Screen Size Smoke Test

**Purpose:** Final check across key screen sizes.

**Step 1: Test these specific viewport sizes in DevTools device simulator**

| Device | Width × Height | Expected behavior |
|--------|---------------|-------------------|
| Desktop 1440×900 | 1440px × 900px | Two-column, board ~770px, scores visible |
| Desktop 1280×800 | 1280px × 800px | Two-column, board ~670px, scores visible |
| iPad landscape | 1024px × 768px | Two-column (≥900px), board fits in height |
| iPad portrait | 768px × 1024px | Single column, board ~calc size, minimal scroll |
| iPhone 14 Pro | 393px × 852px | Single column, board ~calc size, minimal scroll |

**Step 2: Check score input interaction**

On the desktop two-column layout:
- Click a score input field in the right column
- Verify the number spinner (ISpin) appears correctly and can be incremented/decremented
- Verify clicking board cells (left) while score cards are visible (right) works without interference

**Step 3: Check the "About" panel**

Click the "?" button in the title:
- ✅ The about panel (`.modal-panel-about`) should overlay everything (it's `position: absolute` with `z-index: 50`)
- ✅ Click the X to close it and verify the layout returns to normal

**No commit unless fixes were needed.**

---

## Task 7: Final Commit and Build Check

**Step 1: Run a production build to verify no build errors**

```bash
npm run build
```

Expected: Build completes without errors. Output goes to `dist/`.

**Step 2: Preview the production build**

```bash
npm run preview
```

Open the preview URL. Verify the two-column layout works in the built version (not just dev mode).

**Step 3: Final commit (if any last adjustments)**

```bash
git add -p  # review changes interactively
git commit -m "feat: complete two-column layout - board and scores visible without scroll"
```

---

## Summary of All File Changes

| File | Type of change | What changes |
|------|---------------|-------------|
| `index.html` | Structural | Add `<div class="col-board">` and `<div class="col-scores">` wrappers |
| `src/style/style.css` | New CSS block | Append `@media (min-width: 900px)` section at end of file |
| `src/style/style.css` | Modify existing | Change `.board-wrap` size inside `@media (pointer: coarse)` block |

**No JavaScript files are changed.**

---

## Rollback

If something goes wrong, the changes are isolated:
1. `index.html` — remove the two wrapper divs (`.col-board` and `.col-scores`)
2. `style.css` — remove the `@media (min-width: 900px)` block and revert the `.board-wrap` change inside the coarse block

Or simply: `git revert` the relevant commits.
