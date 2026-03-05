# No-Scroll Desktop Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the full game screen fit in a maximized desktop browser (≥900px wide) without vertical scroll.

**Architecture:** All changes are CSS-only inside `src/style/style.css`. Mobile styles (the `@media (pointer: coarse)` block) are untouched. New desktop-only rules are appended in a final `@media (min-width: 900px)` block at the end of the file, which overrides the duplicate global rules at lines 1679+. One fix (board offset) is applied in-place throughout the file.

**Tech Stack:** CSS Grid, Flexbox, CSS `min()` / `calc()` / viewport units.

---

## Context

`style.css` has an unusual structure: there is a `@media (min-width: 900px)` block at lines 1465–1677, then a set of identical-looking rules at lines 1679+ that have **no media query wrapper** — they apply globally and override the media query block due to cascade order. We exploit this by appending a new `@media (min-width: 900px)` block at the very end of the file; since it appears last, it wins over the global rules.

The 4 score cards + 1 final score card are dynamically rendered but always produce the same count. The grid `repeat(3, 1fr)` layout assumes 3 rows: row 1 = score cards A+B, row 2 = score cards C+D, row 3 = final score (spanning 2 columns).

---

## Before You Start

Start the dev server and keep it open throughout:

```bash
npm run dev
```

Open `http://localhost:3000` in a maximized browser window. Zoom out (`Ctrl+-`) to about 80% if your screen is very tall — the goal is a typical desktop viewport around 900–1080px tall.

---

### Task 1: Fix board height offset (130px → 160px)

**Files:**
- Modify: `src/style/style.css` at lines 1511, 1520, 1532–1533, 1715, 1727–1728, 1777

The current formula `calc(100vh - 130px)` assumes 130px for title+terrain, but actual measured heights are title ≈ 70px + terrain bar ≈ 90px = 160px.

**Step 1: Replace all 6 occurrences**

In `src/style/style.css`, change every instance of `100vh - 130px` to `100vh - 160px`. There are exactly 6 occurrences at these lines:

| Line | Context |
|------|---------|
| 1511 | `.terrain-wrap` width (inside `@media (min-width: 900px)`) |
| 1520 | `.terrain-wrap .terrain-type` width formula (inside media query) |
| 1532 | `.board-wrap` width (inside media query) |
| 1533 | `.board-wrap` height (inside media query) |
| 1715 | `.terrain-wrap` width (global section) |
| 1727 | `.board-wrap` width (global section) |
| 1728 | `.board-wrap` height (global section) |
| 1777 | `.join-game-controls .menu-button.join` margin-left formula |

After editing, verify with:
```bash
grep -n "100vh - 130px" src/style/style.css
```
Expected: no output (zero matches).

**Step 2: Visual check**

Reload `http://localhost:3000`. The game board should be slightly smaller than before — it now has a bit more breathing room below it before the window edge.

**Step 3: Commit**

```bash
git add src/style/style.css
git commit -m "fix: correct board height offset from 130px to 160px"
```

---

### Task 2: Anchor height chain (body + page-container)

**Files:**
- Modify: `src/style/style.css` — append to end of file

For flex/grid to distribute vertical space, the root container needs a defined height. We add a new `@media (min-width: 900px)` block at the very end of the file (after line ~1808).

**Step 1: Append the new block**

At the **end** of `src/style/style.css`, add:

```css
/* ===== NO-SCROLL DESKTOP LAYOUT (≥ 900px) ===== */
@media (min-width: 900px) {

  /* Anchor the height chain so flex/grid can distribute vertical space */
  body {
    height: 100vh;
    overflow: hidden;
  }

  .page-container {
    height: 100vh;
    /* grid-template-rows: auto 1fr already present — title bar gets auto,
       col-board and col-scores share the remaining 1fr row */
  }

}
```

**Step 2: Visual check**

Reload. The page should not look different yet — we've just set up the containment. If anything looks broken (content disappears), check that the `}` closing the block is correct.

**Step 3: Commit**

```bash
git add src/style/style.css
git commit -m "feat: anchor 100vh height chain for desktop no-scroll layout"
```

---

### Task 3: Convert col-scores to flex column

**Files:**
- Modify: `src/style/style.css` — inside the block appended in Task 2

The right column needs to become a flex container so its children can fill available height. Gold coins are fixed height; score cards fill the rest.

**Step 1: Extend the `@media (min-width: 900px)` block from Task 2**

Inside the block added in Task 2, after `.page-container { ... }`, add:

```css
  /* Right column: flex column so score section fills remaining height */
  .col-scores {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0; /* CRITICAL: lets flex children shrink below content size */
  }

  /* Gold coins: fixed height, does not grow */
  .gold-coins-wrap {
    flex-shrink: 0;
  }
```

**Step 2: Visual check**

Reload. The gold coins row and score cards should still appear. The right column now behaves as a flex column internally, but the score cards haven't been told to expand yet — they may look the same or slightly compressed.

**Step 3: Commit**

```bash
git add src/style/style.css
git commit -m "feat: make col-scores a flex column for proportional height distribution"
```

---

### Task 4: Convert score-cards section to CSS grid

**Files:**
- Modify: `src/style/style.css` — inside the block from Task 2/3

This is the core change: score-cards-wrap becomes a grid that fills the remaining height in col-scores. Each card row gets an equal `1fr` of that space.

**Step 1: Add the score section grid rules**

Inside the same `@media (min-width: 900px)` block, after the `.gold-coins-wrap` rule, add:

```css
  /* Score cards section: fill remaining col-scores height via CSS grid */
  .score-cards-wrap {
    flex: 1;           /* fill all remaining vertical space after gold coins */
    min-height: 0;     /* CRITICAL: allows flex item to shrink */
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr); /* row 1: cards A+B, row 2: C+D, row 3: final */
    gap: 1.5vw 2%;
    padding: 1vw 0.5vw 0.5vw 0.5vw;
    /* Override flex-direction/flex-wrap set by earlier rules */
    flex-direction: unset;
    flex-wrap: unset;
    justify-content: unset;
  }

  /* Score cards: let the grid control size (no fixed height or margin) */
  .score-card {
    width: auto;
    height: auto;
    max-height: none;
    margin: 0;
  }

  /* Final score card: spans both grid columns */
  .final-score-card {
    grid-column: 1 / -1;
    width: auto;
    height: auto;
    max-height: none;
    margin: 0;
  }
```

The closing `}` of the media block should now be after all these rules.

**Step 2: Visual check — the main verification**

Reload `http://localhost:3000` with the browser maximized.

Check all of the following:
- [ ] No vertical scrollbar appears on the page
- [ ] The game board fills the left column without being cut off at the bottom
- [ ] Gold coins row is visible at the top of the right column
- [ ] All 4 score cards (A, B, C, D) are visible — 2 per row
- [ ] The final score card is visible at the bottom of the right column
- [ ] Score card spinners (▲▼ buttons) are visible and clickable
- [ ] Resizing the browser to a narrow window (< 900px) still works normally with scroll

**Step 3: Check score card internals**

Click a spinner button on a score card and verify the value changes. The internal `.ispin-wrapper` uses `height: 100%` which now means 100% of the grid cell — this should work correctly.

**Step 4: Commit**

```bash
git add src/style/style.css
git commit -m "feat: use CSS grid in score-cards-wrap for proportional no-scroll layout"
```

---

## Final Verification

With the browser maximized:

1. No vertical scroll at any typical desktop resolution (1280×800, 1440×900, 1920×1080)
2. Resize below 900px width — page reverts to normal mobile/scroll behavior
3. Run `npm run build` — confirm no build errors:

```bash
npm run build
```

Expected: `dist/` generated with no errors.
