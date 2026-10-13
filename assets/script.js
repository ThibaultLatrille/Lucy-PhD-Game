/* ============================================================
   Lucy's PhD Journey — game logic
   Pure vanilla JS, no libraries.

   Key design decisions
   --------------------
   1. DETERMINISTIC DICE
      The dice is NOT random. `DICE_CHAIN` is a hand-tuned array of
      17 rolls (values 1-6) that, combined with the hindrance/boost
     effects, walks the player from tile 0 to tile 47 and triggers
     all 21 events exactly once, in the order they appear in
     Lucy-list-v1.md. This guarantees the "story" is always told the
     same way — important for a live presentation.

   2. EVENT TRIGGERING
      An event fires when the player ENDS on its tile, regardless of
      how they got there (dice roll or a hindrance/boost push). Each
      event fires at most once (tracked by `firedEvents`). After a
      push, the new tile is checked again (cascade), which is what
      produces the "double hindrance" at rolls 9-10 (E10 -> E11).

   3. "BREATHE" MODAL
      Shown only when a DICE roll lands on an empty tile. Pushes that
      end on empty tiles do not show a modal (the push already
      explained what happened).

   4. BOARD GEOMETRY
      48 tiles on a 6x8 snake grid. Tile i sits at row floor(i/8),
      column i%8; odd rows are mirrored so the path snakes. An SVG
      polyline (rounded joins) is drawn under the tiles to form the
      "road". Category zones are coloured tints + flag banners.
   ============================================================ */

"use strict";

/* ----------------------------- Data ----------------------------- */

const TILE_COUNT = 48;
const COLS = 8;
const ROWS = 6;
const STEP = 110;   // distance between tile centres (px)
const PAD = 70;     // padding around the first/last tile centre (px)
const BOARD_W = PAD * 2 + (COLS - 1) * STEP; // 910
const BOARD_H = PAD * 2 + (ROWS - 1) * STEP; // 690

// Zone definitions: contiguous tile ranges, each with a flag + tint class.
// Switzerland appears three times (three separate trips) — same tint each time.
const ZONES = [
  { id: "depart", flag: "🏁", name: "Départ",      from: 0,  to: 0,  cls: "z-depart" },
  { id: "swiss1", flag: "🇨🇭", name: "Switzerland", from: 1,  to: 8,  cls: "z-swiss" },
  { id: "thai",   flag: "🇹🇭", name: "Thailand",    from: 9,  to: 15, cls: "z-thai" },
  { id: "mada",   flag: "🇲🇬", name: "Madagascar",  from: 16, to: 24, cls: "z-mada" },
  { id: "swiss2", flag: "🇨🇭", name: "Switzerland", from: 25, to: 32, cls: "z-swiss" },
  { id: "ph",     flag: "🇵🇭", name: "Philippines", from: 33, to: 41, cls: "z-ph" },
  { id: "tw",     flag: "🇹🇼", name: "Taiwan",      from: 42, to: 44, cls: "z-tw" },
  { id: "swiss3", flag: "🇨🇭", name: "Switzerland", from: 45, to: 46, cls: "z-swiss" },
  { id: "end",    flag: "🎓", name: "The Defense", from: 47, to: 47, cls: "z-end" },
];

// The 21 real events, in chronological order (from Lucy-list-v1.md).
// type: "hindrance" (effect < 0), "boost" (effect > 0), "story" (effect 0).
//
// Tile layout (48 tiles, 0-indexed):
//   0  E0  🕊️  Let's Begin                 (Départ)
//   4  E1  ⛰️  Lab Outing                  (Swiss 1, hindrance -2)
//   6  E2  🌿  An Unlikely Fight           (Swiss 1, story)
//   9  E3  🍻  Drinking Game               (Thailand, story)
//  11  E4  🪼  The Jellyfish               (Thailand, story)
//  14  E5  🐕  Stray Dog Bite              (Thailand, hindrance -2)
//  17  E6  🤿  Rusty Diving Gear           (Madagascar, hindrance -2)
//  20  E7  📱  Phone Stolen                (Madagascar, hindrance -2)
//  21  E8  🤢  Food Poisoning              (Madagascar, hindrance -2)
//  24  E9  🦟  Fever & Dizziness           (Madagascar, hindrance -2)
//  27  E10 🪳  Cockroach Invasion          (Swiss 2, hindrance -2)
//  25  E11 📋  Proctoring an Exam          (Swiss 2, hindrance -2)  ← double-hindrance
//  28  E12 📋  Mid-Thesis                  (Swiss 2, story)
//  33  E13 ⚠️  Politician Threats          (Philippines, hindrance -2)
//  34  E14 🚤  The Boat Breaks Down        (Philippines, story)
//  38  E15 🚫  Work Blocked                (Philippines, hindrance -2)
//  42  E16 🐟  The Fish Conference         (Taiwan, boost +2)
//  44  E17 🌋  Earthquake                  (Taiwan, story)
//  45  E18 🍹  Lab Day Off                 (Swiss 3, boost +1)
//  46  E19 💍  Getting Married             (Swiss 3, boost +1)
//  47  E20 🎓  Thesis Defended!            (The Defense, story)
const EVENTS = [
  { id: "E0",  tile: 0,  type: "story",     effect: 0,  emoji: "🕊️",  title: "Let's begin",
    text: "You already escaped both the Kaust golden prison and Trump… the real journey begins." },
  { id: "E1",  tile: 4,  type: "hindrance", effect: -2, emoji: "⛰️",  title: "Lab Outing",
    text: "Teammates organise the lab outing. 2200 m of elevation in half a day — out of breath, several days to recover." },
  { id: "E2",  tile: 6,  type: "story",     effect: 0,  emoji: "🌿",  title: "An Unlikely Fight",
    text: "Your fiancée gets in a fight with the marihuana-dealer neighbour. Wonder what is happening to your life." },
  { id: "E3",  tile: 9,  type: "story",     effect: 0,  emoji: "🍻",  title: "Drinking Game",
    text: "A drinking game with teammates and local collaborators. Wake up hungover and dehydrated… ready for a dive." },
  { id: "E4",  tile: 11, type: "story",     effect: 0,  emoji: "🪼",  title: "The Jellyfish",
    text: "You swallow a jellyfish in the middle of a dive. Spit it out — somehow, it's fine." },
  { id: "E5",  tile: 14, type: "hindrance", effect: -2, emoji: "🐕",  title: "Bitten by a Stray Dog",
    text: "Your local collaborator pets every stray dog and inevitably gets bitten. You lose a day — she decided to risk rabies instead of telling you." },
  { id: "E6",  tile: 17, type: "hindrance", effect: -2, emoji: "🤿",  title: "Rusty Diving Gear",
    text: "The diving material is quite rusty. The tank leaks, out of air — abort diving." },
  { id: "E7",  tile: 20, type: "hindrance", effect: -2, emoji: "📱",  title: "Phone Stolen",
    text: "Your phone gets stolen. The police won't help — you can track it yourself and negotiate with the thief." },
  { id: "E8",  tile: 21, type: "hindrance", effect: -2, emoji: "🤢",  title: "Food Poisoning",
    text: "A food-poisoning trap. You contract diarrhea — diving suddenly gets more complex." },
  { id: "E9",  tile: 24, type: "hindrance", effect: -2, emoji: "🦟",  title: "Fever & Dizziness",
    text: "Suspected malaria. Choose between a local hospital (risk further infections) or hope for the best." },
  { id: "E10", tile: 27, type: "hindrance", effect: -2, emoji: "🪳",  title: "Cockroach Invasion",
    text: "Construction work in the neighbourhood: cockroach invasion in the apartment. No sleep for a few nights." },
  { id: "E11", tile: 25, type: "hindrance", effect: -2, emoji: "📋",  title: "Proctoring an Exam",
    text: "An 'easy day' proctoring an exam. You catch students cheating — lots of paperwork to fill." },
  { id: "E12", tile: 28, type: "story",     effect: 0,  emoji: "📋",  title: "Mid-Thesis",
    text: "It's the mid-thesis. You get cooked on the theory questions." },
  { id: "E13", tile: 33, type: "hindrance", effect: -2, emoji: "⚠️",  title: "Politician Threats",
    text: "Threatened by local politicians: 'You cannot dive or they will shoot you.'" },
  { id: "E14", tile: 34, type: "story",     effect: 0,  emoji: "🚤",  title: "The Boat Breaks Down",
    text: "Geared up and ready — but stuck for 5 hours at sea when the boat breaks down." },
  { id: "E15", tile: 38, type: "hindrance", effect: -2, emoji: "🚫",  title: "Work Blocked",
    text: "Local authorities won't let you work. Never mind, go see the flamboyant octopus." },
  { id: "E16", tile: 42, type: "boost",     effect: 2,  emoji: "🐟",  title: "The Fish Conference",
    text: "You must attend the famous fish conference. Hops on the Hello Kitty plane!" },
  { id: "E17", tile: 44, type: "story",     effect: 0,  emoji: "🌋",  title: "Earthquake",
    text: "There is an earthquake. Never mind — pho and cocktails are the priority." },
  { id: "E18", tile: 45, type: "boost",     effect: 1,  emoji: "🍹",  title: "Lab Day Off",
    text: "It's your turn to organise the lab day off. You choose to make them do cocktails." },
  { id: "E19", tile: 46, type: "boost",     effect: 1,  emoji: "💍",  title: "Getting Married",
    text: "You are getting married, congratulations! You still need to organise it at the same time as you rehearse your defense." },
  { id: "E20", tile: 47, type: "story",     effect: 0,  emoji: "🎓",  title: "Thesis Defended!",
    text: "You passed your thesis and you're flying off to a well-earned vacation in Izmir — cocktails and beach. 🍹🏖️" },
];

// Hand-tuned deterministic dice chain (17 rolls). Verified to trigger all
// 21 events in order, with the double-hindrance at roll 10 (E10 → E11).
//
//   Start:  position 0 → E0 fires (story)
//   Roll  1:  0 +4 =  4  → E1  (hindrance -2 → 2)
//   Roll  2:  2 +4 =  6  → E2  (story)
//   Roll  3:  6 +3 =  9  → E3  (story)
//   Roll  4:  9 +2 = 11  → E4  (story)
//   Roll  5: 11 +3 = 14  → E5  (hindrance -2 → 12)
//   Roll  6: 12 +5 = 17  → E6  (hindrance -2 → 15)
//   Roll  7: 15 +5 = 20  → E7  (hindrance -2 → 18)
//   Roll  8: 18 +3 = 21  → E8  (hindrance -2 → 19)
//   Roll  9: 19 +5 = 24  → E9  (hindrance -2 → 22)
//   Roll 10: 22 +5 = 27  → E10 (hindrance -2 → 25) → E11 fires (hindrance -2 → 23)
//   Roll 11: 23 +3 = 26  → breathe (no event)
//   Roll 12: 26 +2 = 28  → E12 (story)
//   Roll 13: 28 +5 = 33  → E13 (hindrance -2 → 31)
//   Roll 14: 31 +3 = 34  → E14 (story)
//   Roll 15: 34 +4 = 38  → E15 (hindrance -2 → 36)
//   Roll 16: 36 +6 = 42  → E16 (boost +2 → 44) → E17 fires (story)
//   Roll 17: 44 +1 = 45  → E18 (boost +1 → 46) → E19 fires (boost +1 → 47) → E20 fires (story) → GAME OVER
const DICE_CHAIN = [4, 4, 3, 2, 3, 5, 5, 3, 5, 5, 3, 2, 5, 3, 4, 6, 1];

// Dice face pip layouts (3x3 grid, 1 = pip shown).
const PIPS = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

// Rotation (deg) that brings each face to the front of the 3D cube.
const DICE_ROTATION = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

/* ----------------------------- State ----------------------------- */

let position = 0;
let rollIndex = 0;
let firedEvents = new Set();
let rolling = false;
let gameOver = false;

/* --------------------------- DOM refs ---------------------------- */

const boardEl = document.getElementById("board");
const svgEl = document.getElementById("path-svg");
const bannersEl = document.getElementById("banners");
const tilesEl = document.getElementById("tiles");
const tokenEl = document.getElementById("token");
const diceEl = document.getElementById("dice");
const rollBtn = document.getElementById("roll-btn");
const statusEl = document.getElementById("status");
const progressFill = document.getElementById("progress-fill");
const modalOverlay = document.getElementById("modal-overlay");
const modalEl = document.getElementById("modal");
const modalFlag = document.getElementById("modal-flag");
const modalEmoji = document.getElementById("modal-emoji");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalEffect = document.getElementById("modal-effect");
const modalBtn = document.getElementById("modal-btn");
const modalGallery = document.getElementById("modal-gallery");
const finaleEl = document.getElementById("finale");
const confettiEl = document.getElementById("confetti");

/* ------------------------- Geometry helpers --------------------- */

// Centre (px) of tile i on the snake grid.
function tileCenter(i) {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const x = (r % 2 === 0) ? c : (COLS - 1 - c);
  return { x: PAD + x * STEP, y: PAD + r * STEP };
}

function zoneForTile(i) {
  return ZONES.find((z) => i >= z.from && i <= z.to);
}

function eventAtTile(i) {
  return EVENTS.find((e) => e.tile === i);
}

/* --------------------------- Rendering -------------------------- */

function renderBoard() {
  boardEl.style.width = BOARD_W + "px";
  boardEl.style.height = BOARD_H + "px";
  svgEl.setAttribute("width", BOARD_W);
  svgEl.setAttribute("height", BOARD_H);
  svgEl.setAttribute("viewBox", `0 0 ${BOARD_W} ${BOARD_H}`);
}

function renderRoad() {
  // Build the polyline points through every tile centre.
  const pts = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    const { x, y } = tileCenter(i);
    pts.push(`${x},${y}`);
  }
  const points = pts.join(" ");

  const road = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  road.setAttribute("points", points);
  road.setAttribute("class", "road");
  svgEl.appendChild(road);

  const center = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  center.setAttribute("points", points);
  center.setAttribute("class", "road-center");
  svgEl.appendChild(center);

  // Direction arrows at the midpoint of each segment.
  for (let i = 0; i < TILE_COUNT - 1; i++) {
    const a = tileCenter(i);
    const b = tileCenter(i + 1);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", "-6,-5 6,0 -6,5");
    arrow.setAttribute("class", "road-arrow");
    arrow.setAttribute("transform", `translate(${mx} ${my}) rotate(${angle})`);
    svgEl.appendChild(arrow);
  }
}

function renderTiles() {
  for (let i = 0; i < TILE_COUNT; i++) {
    const { x, y } = tileCenter(i);
    const zone = zoneForTile(i);
    const ev = eventAtTile(i);

    const tile = document.createElement("div");
    tile.className = `tile ${zone.cls}`;
    tile.id = `tile-${i}`;
    tile.style.left = x - 30 + "px"; // half of --tile (60px)
    tile.style.top = y - 30 + "px";

    if (ev) {
      tile.textContent = ev.emoji;
      tile.title = ev.title;
    } else {
      // Quiet tile: a small dot so the path reads as a journey.
      const dot = document.createElement("span");
      dot.className = "dot dot-empty";
      tile.appendChild(dot);
    }

    tilesEl.appendChild(tile);
  }
}

function renderBanners() {
  ZONES.forEach((z) => {
    const { x, y } = tileCenter(z.from);
    const banner = document.createElement("div");
    banner.className = "banner";
    banner.textContent = `${z.flag} ${z.name}`;
    // Place the banner above the entry tile.
    banner.style.left = x + "px";
    banner.style.top = y - 44 + "px";
    bannersEl.appendChild(banner);
  });
}

function renderToken() {
  const { x, y } = tileCenter(position);
  tokenEl.style.left = x - 22 + "px"; // half of token (44px)
  tokenEl.style.top = y - 22 + "px";
}

function buildDice() {
  // Build the 6 faces of the 3D cube.
  const faces = [
    { n: 1, transform: "rotateY(0deg) translateZ(38px)" },
    { n: 2, transform: "rotateY(90deg) translateZ(38px)" },
    { n: 3, transform: "rotateX(90deg) translateZ(38px)" },
    { n: 4, transform: "rotateX(-90deg) translateZ(38px)" },
    { n: 5, transform: "rotateY(-90deg) translateZ(38px)" },
    { n: 6, transform: "rotateY(180deg) translateZ(38px)" },
  ];
  faces.forEach((f) => {
    const face = document.createElement("div");
    face.className = "dice-face";
    face.style.transform = f.transform;
    PIPS[f.n].forEach((on) => {
      const cell = document.createElement("div");
      cell.className = "pip-cell" + (on ? " filled" : "");
      face.appendChild(cell);
    });
    diceEl.appendChild(face);
  });
}

function updateProgress() {
  const pct = (position / (TILE_COUNT - 1)) * 100;
  progressFill.style.width = pct + "%";
}

function markFired(tileIndex) {
  const tile = document.getElementById(`tile-${tileIndex}`);
  if (tile) tile.classList.add("fired");
}

/* --------------------------- Dice roll -------------------------- */

let diceSpin = 0; // accumulates full turns for a continuous spin feel

function animateDice(value, done) {
  // Add two full turns plus the target orientation so the cube visibly spins.
  diceSpin += 720;
  const target = DICE_ROTATION[value];
  // Parse the base rotation and add the spin to the Y axis.
  const m = target.match(/rotateX\((-?\d+)deg\)\s*rotateY\((-?\d+)deg\)/);
  const rx = m ? parseInt(m[1], 10) : 0;
  const ry = m ? parseInt(m[2], 10) : 0;
  diceEl.style.transform = `rotateX(${rx}deg) rotateY(${ry + diceSpin}deg)`;

  // Wait for the CSS transition (1.05s) to finish.
  setTimeout(done, 1100);
}

/* --------------------------- Movement --------------------------- */

// Step the token from one tile to the next (a single horizontal or
// vertical hop). The snake path only has horizontal/vertical segments,
// so stepping through intermediate tiles makes the token follow the road
// instead of cutting across diagonally.
function stepToken(toIndex, done) {
  const { x, y } = tileCenter(toIndex);
  tokenEl.style.left = x - 22 + "px"; // half of token (44px)
  tokenEl.style.top = y - 22 + "px";
  // Per-step transition is 0.2s; add a small pause between steps.
  setTimeout(done, 260);
}

// Move the token from its current tile to `toIndex` by stepping through
// every intermediate tile, so it walks along the path (no diagonals).
function moveToken(toIndex, done) {
  const from = position;
  const dir = toIndex > from ? 1 : -1;
  const steps = Math.abs(toIndex - from);
  if (steps === 0) {
    done();
    return;
  }
  let i = 0;
  const step = () => {
    i += 1;
    const next = from + dir * i;
    if (i >= steps) {
      stepToken(toIndex, done);
    } else {
      stepToken(next, step);
    }
  };
  step();
}

/* --------------------------- Modals ----------------------------- */

function showModal(type, flag, emoji, title, text, effectText, onContinue, images, hideButton) {
  modalEl.className = "modal type-" + type;
  modalFlag.textContent = flag;
  modalEmoji.textContent = emoji;
  modalTitle.textContent = title;
  modalText.textContent = text;
  if (effectText) {
    modalEffect.textContent = effectText;
    modalEffect.classList.remove("hidden");
  } else {
    modalEffect.classList.add("hidden");
  }

  // Populate the image gallery (if images are provided).
  populateGallery(images);

  modalOverlay.classList.remove("hidden");
  if (hideButton) {
    // Terminal modal: no action button (the game ends right after this).
    modalBtn.classList.add("hidden");
    modalBtn.onclick = null;
  } else {
    modalBtn.classList.remove("hidden");
    modalBtn.onclick = () => {
      modalOverlay.classList.add("hidden");
      onContinue();
    };
  }
}

/**
 * Populate the modal image gallery (up to 3 images, side by side).
 * @param {string[]|undefined} images - Array of image paths, or undefined/empty.
 */
function populateGallery(images) {
  modalGallery.innerHTML = "";

  if (!images || images.length === 0) {
    modalGallery.classList.add("hidden");
    return;
  }

  modalGallery.classList.remove("hidden");

  // Show up to 3 images side by side.
  const shown = images.slice(0, 3);
  modalGallery.dataset.count = shown.length;
  shown.forEach((src, idx) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `Photo ${idx + 1}`;
    modalGallery.appendChild(img);
  });
}

function showEventModal(ev, onContinue) {
  const zone = zoneForTile(ev.tile);
  let effectText = "";
  if (ev.type === "hindrance") effectText = `Pushed back ${Math.abs(ev.effect)} tiles`;
  if (ev.type === "boost") effectText = `Pushed forward ${ev.effect} tiles`;
  const images = (typeof EVENT_IMAGES !== "undefined") ? EVENT_IMAGES[ev.id] : undefined;
  const isLast = ev.tile === TILE_COUNT - 1;
  showModal(ev.type, `${zone.flag} ${zone.name}`, ev.emoji, ev.title, ev.text, effectText, isLast ? null : onContinue, images, isLast);
}

function showBreatheModal(onContinue) {
  showModal(
    "empty",
    "🌿 Quiet tile",
    "🌬️",
    "Take a breath",
    "Nothing happens here. Catch your breath, enjoy the view, and continue the journey.",
    "",
    onContinue,
    ["images/Breather - 1.jpg"]
  );
}

/* --------------------------- Game flow -------------------------- */

function setRolling(isRolling) {
  rolling = isRolling;
  rollBtn.disabled = isRolling || gameOver;
}

function rollDice() {
  if (rolling || gameOver) return;
  if (rollIndex >= DICE_CHAIN.length) return;

  setRolling(true);
  const value = DICE_CHAIN[rollIndex];
  rollIndex += 1;
  statusEl.textContent = `Rolling…`;

  animateDice(value, () => {
    const target = Math.min(position + value, TILE_COUNT - 1);
    statusEl.textContent = `Rolled a ${value}!`;
    moveToken(target, () => {
      position = target;
      updateProgress();
      handleLanding(target, true, () => {
        setRolling(false);
        if (position === TILE_COUNT - 1) {
          showFinale();
        } else {
          statusEl.textContent = `Rolled a ${value}. Ready for the next roll?`;
        }
      });
    });
  });
}

function handleLanding(tileIndex, isDiceLanding, onDone) {
  const ev = eventAtTile(tileIndex);

  if (ev && !firedEvents.has(ev.id)) {
    firedEvents.add(ev.id);
    markFired(tileIndex);
    if (ev.tile === TILE_COUNT - 1) {
      // Final tile: show the last event with no Continue button, let the
      // graduation photo sit for a moment, then bring in the finale.
      showEventModal(ev, null);
      setTimeout(onDone, 2200);
      return;
    }
    showEventModal(ev, () => {
      applyEffect(ev, onDone);
    });
    return;
  }

  // No (unfired) event on this tile.
  if (isDiceLanding) {
    showBreatheModal(onDone);
  } else {
    onDone();
  }
}

function applyEffect(ev, onDone) {
  if (ev.type === "story") {
    onDone();
    return;
  }
  const newPos = position + ev.effect;
  moveToken(newPos, () => {
    position = newPos;
    updateProgress();
    // Cascade: check the tile we were pushed onto (isDiceLanding = false).
    handleLanding(newPos, false, onDone);
  });
}

/* ----------------------------- Finale --------------------------- */

function showFinale() {
  gameOver = true;
  rollBtn.disabled = true;
  statusEl.textContent = "Journey complete!";
  spawnConfetti();
  finaleEl.classList.remove("hidden");
}

function spawnConfetti() {
  confettiEl.innerHTML = "";
  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];
  for (let i = 0; i < 120; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = 2.5 + Math.random() * 3 + "s";
    piece.style.animationDelay = Math.random() * 2 + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiEl.appendChild(piece);
  }
}

/* ----------------------------- Init ----------------------------- */

function init() {
  renderBoard();
  renderRoad();
  renderTiles();
  renderBanners();
  buildDice();
  renderToken();
  updateProgress();
  setRolling(false);

  rollBtn.addEventListener("click", rollDice);

  // Fire the opening event (E0, tile 0) so the journey begins with a story
  // moment rather than a silent start.
  startGame();
}

function startGame() {
  const ev = eventAtTile(0);
  if (ev && !firedEvents.has(ev.id)) {
    handleLanding(0, true, () => {
      setRolling(false);
      statusEl.textContent = "Press \"Roll the dice\" to continue.";
    });
  }
}

init();
