/* ============================================================
   Lucy's PhD game — game logic
   ------------------------------------------------------------
   Tech: vanilla JavaScript (ES2020), no libraries, no build step.
   Why no framework: the game is a small, self-contained state
   machine (board + dice + modal). Vanilla JS keeps the PoC
   dependency-free so it runs offline at the presentation venue
   by just opening main.html.

   Rules
   -----
   - The board is a fixed linear path of 48 tiles (displayed as a
     serpentine grid: 8 columns x 6 rows, bottom row left-to-right,
     then snaking back). Tile 1 is the start, tile 48 is the goal.
   - The path is DETERMINISTIC: each click rolls the next value from
     DICE_SCRIPT (16 fixed values, no randomness). The script is crafted
     so every landing falls exactly on the next event tile and the final
     roll reaches tile 48. The same board always plays out identically.
   - 15 pre-determined events (the real ones from Lucy-list.md) are
     placed on fixed tiles. Landing exactly on an event tile the
     FIRST time triggers its modal and its effect:
         effect < 0  -> Lucy is pushed back that many tiles
         effect  > 0  -> Lucy jumps forward (unused in current data)
         effect  = 0  -> story only, no movement
     Each event fires only once; penalty moves never re-trigger
     events (no cascades).
   - With the current DICE_SCRIPT + event data, no push-back ever
     reaches tile 1, so the game always ends in a win. The lose
     overlay remains as a safety net if the event data is edited so
     a penalty would push Lucy all the way back to tile 1.
   - Reaching tile 48 shows the congratulatory defense message.

   No try/catch anywhere; all failure modes are impossible by
   construction (fixed board, bounded dice, data-driven events).
   ============================================================ */
(() => {
  "use strict";

  // ---------- configuration ----------
  const TOTAL_TILES = 48;
  const GOAL_TILE = 48;
  const BOARD_COLS = 8;
  const BOARD_ROWS = Math.ceil(TOTAL_TILES / BOARD_COLS); // 6
  const STEP_MS = 150;          // time per single-tile hop
  const DICE_FLIP_MS = 65;      // dice face flicker speed
  const DICE_FLIPS = 9;         // flickers before the final face

  // Deterministic roll script: the path lands on every event tile (in
  // order) AND on several non-event tiles (where a "breather" modal is
  // shown), and the final roll reaches the goal (tile 48). Every value
  // is in 1..6 and no roll can overshoot the goal.
  //
  // Full path (L = landing tile, P = position after the event push-back):
  //   1 ->3 ->5(-3)->2 ->8(-3)->5 ->10 ->11(-2)->9 ->14(-2)->12 ->16
  //   ->18(0) ->21(0) ->25(-3)->22 ->28(-2)->26 ->30 ->31(0)
  //   ->34(-2)->32 ->36 ->37(-2)->35 ->39(0) ->42(0) ->44(-3)->41
  //   ->46(-1)->45 ->48 (goal)
  // 21 rolls; non-event landings (breather): 3, 10, 16, 30, 36.
  const DICE_SCRIPT = [2, 2, 6, 5, 1, 5, 4, 2, 3, 4, 6, 4, 1, 3, 4, 1, 4, 3, 2, 5, 3];

  // The 15 real events from Lucy-list.md, on fixed tiles.
  // kind: "bad" (pushed back), "neutral" (story only).
  const EVENTS = [
    { tile: 5,  emoji: "🤿", title: "Rusty diving material",
      text: "The tank leaks, you're out of air — you have to abort the dive.",
      effect: -3 },
    { tile: 8,  emoji: "📵", title: "Phone stolen",
      text: "The police won't help, so you track it yourself and negotiate with the thief.",
      effect: -3 },
    { tile: 11, emoji: "🤢", title: "Food poisoning",
      text: "You contracted diarrhea and suddenly diving gets a lot more complex.",
      effect: -2 },
    { tile: 14, emoji: "🪳", title: "Cockroach invasion",
      text: "Construction work in your neighborhood brings a cockroach invasion. No sleep for a few nights.",
      effect: -2 },
    { tile: 18, emoji: "💜", title: "A colleague in hard time",
      text: "A colleague is going through a hard time during fieldwork. You put your therapist skills to work. No sleep for a few nights.",
      effect: 0 },
    { tile: 21, emoji: "💍", title: "You are getting married!",
      text: "Congratulations! But time to rest is over: you organize the wedding while rehearsing your defense.",
      effect: 0 },
    { tile: 25, emoji: "⚠️", title: "Threatened by local politicians",
      text: "The local politicians threaten you: you cannot dive or they will shoot you.",
      effect: -3 },
    { tile: 28, emoji: "🚤", title: "The boat breaks down",
      text: "Fully geared up, you are stuck at sea for 5 hours on a dead engine.",
      effect: -2 },
    { tile: 31, emoji: "📝", title: "Students caught cheating",
      text: "You caught students cheating. Handling it was not part of the to-do list.",
      effect: 0 },
    { tile: 34, emoji: "⛰️", title: "Lab outing",
      text: "Your teammates organized a lab outing: 2200 m of elevation in half a day. You are out of breath and need several days to recover.",
      effect: -2 },
    { tile: 37, emoji: "💉", title: "Colleague without vaccine",
      text: "A colleague who was supposed to join the fieldwork doesn't have the vaccine. More work for you — enjoy!",
      effect: -2 },
    { tile: 39, emoji: "🪼", title: "Jellyfish down the throat",
      text: "In the middle of a dive, you swallow a jellyfish. You spit it out. Somehow, it's fine.",
      effect: 0 },
    { tile: 42, emoji: "🌿", title: "Fiancée vs. neighbor",
      text: "Your fiancée gets in a fight with your marihuana-dealer neighbor. You wonder what is happening to your life.",
      effect: 0 },
    { tile: 44, emoji: "🦟", title: "Suspected malaria",
      text: "Fever and dizziness during fieldwork in Africa, suspected malaria. Local hospital or hope for the best?",
      effect: -3 },
    { tile: 46, emoji: "🍻", title: "Drinking game in Thailand",
      text: "You play a drinking game with teammates and local collaborators. You wake up hungover and dehydrated… ready for a dive.",
      effect: -1 },
  ];
  const EVENT_BY_TILE = Object.fromEntries(EVENTS.map((e) => [e.tile, e]));

  // ---------- state ----------
  const state = {
    pos: 1,          // current tile (1-based)
    rollIndex: 0,    // next index into DICE_SCRIPT
    used: new Set(), // tiles whose event already fired
    rolls: 0,
    busy: false,     // input locked while animating / modal open
    over: false,     // game finished (win or lose)
    run: 0,          // generation counter: invalidates stale timers on reset
    modalKind: null, // "event" | "breather" | null (which modal is open)
  };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const diceEl = $("dice");
  const rollBtn = $("rollBtn");
  const restartBtn = $("restartBtn");
  const modalEl = $("modal");
  const modalBadge = $("modalBadge");
  const modalTitle = $("modalTitle");
  const modalText = $("modalText");
  const modalEffect = $("modalEffect");
  const modalBtn = $("modalBtn");
  const winOverlay = $("winOverlay");
  const winStats = $("winStats");
  const winBtn = $("winBtn");
  const loseOverlay = $("loseOverlay");
  const loseSub = $("loseSub");
  const loseBtn = $("loseBtn");

  /** @type {Map<number, HTMLLIElement>} tile number -> element */
  let tileEls = new Map();
  /** @type {HTMLDivElement} */
  let tokenEl;

  // ---------- board construction ----------
  /**
   * Serpentine placement: tile 1 sits bottom-left. Each row of 8
   * alternates direction; CSS grid row 1 is at the top.
   */
  function gridPos(tileNum) {
    const idx = tileNum - 1;
    const rowFromBottom = Math.floor(idx / BOARD_COLS);
    const posInRow = idx % BOARD_COLS;
    const col = rowFromBottom % 2 === 0 ? posInRow + 1 : BOARD_COLS - posInRow;
    const row = BOARD_ROWS - rowFromBottom;
    return { col, row };
  }

  /**
   * Arrow showing the direction of the journey out of this tile.
   * The path snakes: even rows run left-to-right (→), odd rows run
   * right-to-left (←), and the last tile of every row turns upward
   * (↑) into the next row.
   */
  function pathArrow(tileNum) {
    const idx = tileNum - 1;
    const rowFromBottom = Math.floor(idx / BOARD_COLS);
    const posInRow = idx % BOARD_COLS;
    if (posInRow === BOARD_COLS - 1) return "↑";
    return rowFromBottom % 2 === 0 ? "→" : "←";
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    tileEls = new Map();
    for (let i = 1; i <= TOTAL_TILES; i++) {
      const li = document.createElement("li");
      li.className = "tile";
      li.dataset.tile = String(i);
      const { col, row } = gridPos(i);
      li.style.gridColumn = String(col);
      li.style.gridRow = String(row);

      if (i === 1) {
        li.classList.add("is-start");
        const e = document.createElement("span");
        e.className = "tile-emoji";
        e.textContent = "🚀";
        li.appendChild(e);
      } else if (i === GOAL_TILE) {
        li.classList.add("is-goaled");
        const e = document.createElement("span");
        e.className = "tile-emoji";
        e.textContent = "🏆";
        li.appendChild(e);
      } else {
        // Show the direction of the journey (a path arrow) instead of
        // a tile number, so the snake path reads as a continuous road.
        const arrow = document.createElement("span");
        arrow.className = "tile-arrow";
        arrow.textContent = pathArrow(i);
        li.appendChild(arrow);
      }

      const ev = EVENT_BY_TILE[i];
      if (ev) {
        li.classList.add("has-event");
        // Color the tile by the kind of event it triggers:
        //   bad     (effect < 0) -> red
        //   neutral (effect = 0) -> yellow
        //   good    (effect > 0) -> green (unused in current data)
        li.classList.add(ev.effect < 0 ? "tile-bad" : ev.effect > 0 ? "tile-good" : "tile-neutral");
        const mark = document.createElement("span");
        mark.className = "event-mark";
        mark.textContent = ev.emoji;
        li.appendChild(mark);
      }

      boardEl.appendChild(li);
      tileEls.set(i, li);
    }

    tokenEl = document.createElement("div");
    tokenEl.className = "token";
    tokenEl.textContent = "🎓";
    tokenEl.setAttribute("aria-label", "Lucy");
    tileEls.get(1).appendChild(tokenEl);
  }

  // ---------- status bar ----------
  function markVisited(tileNum) {
    const li = tileEls.get(tileNum);
    li.classList.add("tile-visited");
    li.classList.remove("tile-current");
  }

  function markCurrent(tileNum) {
    const li = tileEls.get(tileNum);
    li.classList.add("tile-current");
  }

  // The roll button is only visible/usable when the player may roll:
  // hidden while the dice is rolling, the token is moving, or a modal
  // is open (all of which keep state.busy true).
  function syncRollButton() {
    rollBtn.hidden = state.busy;
  }

  // ---------- token movement (animated, one tile per step) ----------
  function placeToken(tileNum) {
    tileEls.get(tileNum).appendChild(tokenEl);
    tokenEl.classList.remove("token-bounce");
    void tokenEl.offsetWidth; // reflow so the animation restarts
    tokenEl.classList.add("token-bounce");
  }

  /**
   * Move the token one hop at a time from `from` to `to`
   * (forward or backward), then call onDone. Stale timers from a
   * previous run are ignored via the run counter.
   */
  function stepMove(from, to, onDone) {
    if (from === to) {
      onDone();
      return;
    }
    const dir = to > from ? 1 : -1;
    const next = from + dir;
    const myRun = state.run;
    state.pos = next;
    markVisited(from);
    markCurrent(next);
    placeToken(next);
    if (next === to) {
      onDone();
      return;
    }
    setTimeout(() => {
      if (state.run !== myRun) return; // a reset happened meanwhile
      stepMove(next, to, onDone);
    }, STEP_MS);
  }

  // ---------- dice ----------
  function setFace(value) {
    diceEl.className = "dice face-" + value;
    diceEl.setAttribute("aria-label", "Dice showing " + value);
  }

  function rollDice() {
    if (state.busy || state.over) return;
    if (state.rollIndex >= DICE_SCRIPT.length) return;
    state.busy = true;
    syncRollButton();
    const myRun = state.run;
    const result = DICE_SCRIPT[state.rollIndex];
    const start = state.pos;

    diceEl.classList.add("rolling");
    let flips = 0;
    const flip = setInterval(() => {
      if (state.run !== myRun) {
        clearInterval(flip);
        return;
      }
      setFace(1 + Math.floor(Math.random() * 6));
      flips += 1;
      if (flips >= DICE_FLIPS) {
        clearInterval(flip);
        setFace(result);
        diceEl.classList.remove("rolling");
        diceEl.classList.add("landed");
        setTimeout(() => diceEl.classList.remove("landed"), 400);
        state.rolls += 1;
        state.rollIndex += 1;

        const dest = start + result;
        stepMove(start, dest, () => {
          if (state.run !== myRun) return;
          if (dest >= GOAL_TILE) {
            win();
            return;
          }
          const ev = EVENT_BY_TILE[dest];
          if (ev && !state.used.has(dest)) {
            state.used.add(dest);
            showEventModal(ev);
          } else {
            // No event on this tile (or it already fired): a quiet
            // "breather" moment so the journey keeps its rhythm.
            showBreatherModal();
          }
        });
      }
    }, DICE_FLIP_MS);
  }

  // ---------- event modal ----------
  function effectLabel(ev) {
    if (ev.effect === 0) {
      return "Story moment — no effect on the journey.";
    }
    if (ev.effect > 0) {
      return `Lucy jumps forward ${ev.effect} tile${ev.effect > 1 ? "s" : ""}!`;
    }
    return `Lucy is pushed back ${-ev.effect} tile${ev.effect < -1 ? "s" : ""}!`;
  }

  function showEventModal(ev) {
    const myRun = state.run;
    const kind = ev.effect < 0 ? "bad" : ev.effect > 0 ? "good" : "neutral";
    state.modalKind = "event";
    modalBadge.className = "modal-badge " + kind;
    modalBadge.textContent = kind === "bad" ? "Setback" : kind === "good" ? "Boost" : "Story";
    modalTitle.textContent = `${ev.emoji} ${ev.title}`;
    modalText.textContent = ev.text;
    modalEffect.className = "modal-effect " + kind;
    modalEffect.textContent = effectLabel(ev);
    modalEl.hidden = false;

    const li = tileEls.get(ev.tile);
    const mark = li.querySelector(".event-mark");
    if (mark) mark.textContent = "✓";
  }

  // A quiet "breather" shown when Lucy lands on a tile with no event.
  // It keeps the journey's rhythm and reassures the player that the
  // road ahead is clear for a moment.
  function showBreatherModal() {
    state.modalKind = "breather";
    modalBadge.className = "modal-badge roll";
    modalBadge.textContent = "Breather";
    modalTitle.textContent = "🌤️ A quiet stretch of the road";
    modalText.textContent =
      "No surprises here — just the road ahead. Take a breath, " +
      "gather your thoughts, and continue the journey to the defense.";
    modalEffect.className = "modal-effect roll";
    modalEffect.textContent = "No effect — the journey continues.";
    modalEl.hidden = false;
  }

  function closeModalAndApply(ev) {
    modalEl.hidden = true;
    const myRun = state.run;
    const from = state.pos;
    const to = Math.min(Math.max(from + ev.effect, 1), GOAL_TILE);
    if (to === from) {
      state.busy = false;
      syncRollButton();
      return;
    }
    stepMove(from, to, () => {
      if (state.run !== myRun) return;
      if (to >= GOAL_TILE) {
        win();
      } else if (to === 1) {
        lose();
      } else {
        state.busy = false;
        syncRollButton();
      }
    });
  }

  // ---------- win / lose ----------
  function spawnConfetti() {
    const box = document.querySelector(".confetti");
    box.innerHTML = "";
    const colors = ["#ffd166", "#43c97b", "#4fc3f7", "#ff6b6b", "#b39dff", "#ffffff"];
    for (let i = 0; i < 70; i += 1) {
      const p = document.createElement("i");
      p.style.left = (Math.random() * 100).toFixed(1) + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (2 + Math.random() * 2).toFixed(2) + "s";
      p.style.animationDelay = (Math.random() * 2).toFixed(2) + "s";
      box.appendChild(p);
    }
  }

  function win() {
    state.over = true;
    state.busy = true;
    syncRollButton();
    markVisited(state.pos === GOAL_TILE ? GOAL_TILE - 1 : state.pos);
    markCurrent(GOAL_TILE);
    placeToken(GOAL_TILE);
    winStats.textContent =
      `Thesis defended in ${state.rolls} rolls, ` +
      `${state.used.size} PhD events survived.`;
    winOverlay.hidden = false;
    spawnConfetti();
  }

  function lose() {
    state.over = true;
    state.busy = true;
    syncRollButton();
    markCurrent(1);
    loseSub.textContent =
      `A rough stretch pushed Lucy all the way back to tile 1 ` +
      `after ${state.rolls} rolls and ${state.used.size} events.`;
    loseOverlay.hidden = false;
  }

  // ---------- reset ----------
  function reset() {
    state.run += 1; // invalidate any pending timers from the old run
    state.pos = 1;
    state.rollIndex = 0;
    state.used = new Set();
    state.rolls = 0;
    state.busy = false;
    state.over = false;
    state.modalKind = null;
    modalEl.hidden = true;
    winOverlay.hidden = true;
    loseOverlay.hidden = true;
    buildBoard();
    markCurrent(1);
    setFace(1);
    syncRollButton();
  }

  // ---------- wiring ----------
  rollBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    rollDice();
  });
  restartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    reset();
  });
  // Dismiss the open modal. Triggered by the Continue button OR by
  // clicking anywhere on the overlay. For an event modal this also
  // applies the event's movement effect; a breather modal simply
  // closes and unlocks the next roll.
  function dismissModal() {
    if (modalEl.hidden) return;
    if (state.modalKind === "event") {
      const ev = EVENT_BY_TILE[state.pos];
      if (ev) closeModalAndApply(ev);
    } else if (state.modalKind === "breather") {
      modalEl.hidden = true;
      state.modalKind = null;
      state.busy = false;
      syncRollButton();
    }
  }
  modalBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dismissModal();
  });
  // Clicking anywhere on the overlay (outside the card) also dismisses.
  modalEl.addEventListener("click", (e) => {
    e.stopPropagation();
    dismissModal();
  });
  winBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    reset();
  });
  loseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    reset();
  });
  // Click anywhere (except on buttons) rolls the dice.
  document.addEventListener("click", () => {
    rollDice();
  });

  // ---------- boot ----------
  buildBoard();
  markCurrent(1);
  syncRollButton();
})();
