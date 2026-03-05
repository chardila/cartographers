# No-Scroll Desktop Layout Design

**Date:** 2026-03-05
**Goal:** The entire game screen fits in a maximized browser without vertical scroll (desktop only, minimum ~768px viewport height).

## Problem

Both columns overflow the viewport vertically:
- **Left column:** board height offset (`calc(100vh - 130px)`) doesn't account for title bar (~70px) + terrain bar (~90px) correctly.
- **Right column:** score cards use fixed `vw`-based heights and margins that grow with viewport width, not height — no mechanism to fit in available vertical space.

## Solution: Option B — Flexbox fill with proportional cards

Scope: all changes inside `@media (min-width: 900px)` only. Mobile is unchanged.

### 1. Anchor height chain

```css
/* Inside @media (min-width: 900px) */
body {
  height: 100vh;
  overflow: hidden;
}
.page-container {
  height: 100vh;
  /* grid-template-rows: auto 1fr already distributes title vs columns */
}
```

### 2. Fix board height offset

Change `calc(100vh - 130px)` → `calc(100vh - 160px)` in:
- `.board-wrap` width and height
- `.terrain-wrap` width (and `.terrain-wrap .terrain-type` width formula)

Rationale: title bar ≈ 70px + terrain bar ≈ 90px = 160px.

### 3. Right column — flex column

```css
.col-scores {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* allows flex children to shrink below content size */
}

.gold-coins-wrap {
  flex-shrink: 0; /* fixed height, doesn't participate in flex growth */
}

.score-cards-wrap {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, 1fr); /* 2 rows of score cards + 1 row for final */
  gap: 1.5vw 2%;
  padding: 1vw 0.5vw 0 0.5vw;
}

.score-card {
  height: auto;
  max-height: none;
  margin: 0;
}

.final-score-card {
  grid-column: 1 / -1;
  height: auto;
  max-height: none;
  margin: 0;
}
```

## What does NOT change

- All mobile/tablet styles
- Network game mode (transform-based slide still works)
- Score card internals (spinners, inputs, field layout)
- All other CSS rules outside the desktop media query
