/* ============================================================
   Lucy's PhD Journey — Image Manifest

   This file maps event IDs to image file paths. To add or remove
   images for an event, simply edit this file — no changes to
   script.js or style.css are needed.

   Format:
     EVENT_IMAGES = {
       "<event-id>": ["images/file1.jpg", "images/file2.jpg", ...],
       ...
     }

   - Keys are event IDs (e.g. "E0", "E1", ...).
   - Values are arrays of image paths (relative to the HTML file).
   - Events with no images simply have no entry (or an empty array).
   - The modal displays up to 3 images side by side in a grid layout.
   - Supported formats: .jpg, .jpeg, .png, .webp.
     (Original .HEIC photos were converted to .jpg via `sips` for
      cross-browser compatibility — Chrome/Firefox cannot render HEIC.)
   ============================================================ */

const EVENT_IMAGES = {
  E0: [
    "images/The Great Escape - 1.jpg",
  ],

  // E1 — Lab Outing (Switzerland 1)
  E1: [
    "images/Z1 - Swiss - Lab outing - 1.jpg",
    "images/Z1 - Swiss - Lab outing - 2.jpg",
  ],

  // E2 — An Unlikely Fight (Switzerland 1)
  E2: [
    "images/Z1 - Swiss - Weed - 1.jpg",
  ],

  // E3 — Drinking Game (Thailand)
  E3: [
    "images/Z2 - Thailand - 1.jpg",
    "images/Z2 - Thailand - 2.jpg",
  ],

  // E4 — The Jellyfish (Thailand)
  E4: [
    "images/Z2 - Thailand - 1.jpg",
    "images/Z2 - Thailand - 2.jpg",
  ],

  // E5 — Bitten by a Stray Dog (Thailand)
  E5: [
    "images/Z2 - Thailand - 1.jpg",
    "images/Z2 - Thailand - 2.jpg",
  ],

  // E6 — Rusty Diving Gear (Madagascar)
  E6: [
    "images/Z3 - Madagascar - 1.jpg",
  ],

  // E7 — Phone Stolen (Madagascar)
  E7: [
    "images/Z3 - Madagascar - 2.jpg",
  ],

  // E8 — Food Poisoning (Madagascar)
  E8: [
    "images/Z3 - Madagascar - 3.jpg",
  ],

  // E9 — Fever & Dizziness (Madagascar)
  E9: [
    "images/Z3 - Madagascar - 4.jpg",
    "images/Z3 - Madagascar - 5.jpg",
  ],

  // E10 — Cockroach Invasion (Switzerland 2)
  E10: [
    "images/Z4 - Swiss - Cockroach - 1.jpg",
  ],

  // E11 — Proctoring an Exam (Switzerland 2)
  E11: [
    "images/Z4 - Swiss - Proctoring an Exam - 1.jpg",
  ],

  // E12 — Mid-Thesis (Switzerland 2)
  E12: [
    "images/Z4 - Swiss - Mid Thesis - 1.jpg",
  ],

  // E13 — Politician Threats (Philippines)
  E13: [
    "images/Z5 - Philippines - Politician threats - 1.jpg",
  ],

  // E14 — The Boat Breaks Down (Philippines)
  E14: [
    "images/Z5 - Philippines - The Boat Breaks Down - 1.jpg",
  ],

  // E15 — Work Blocked (Philippines)
  E15: [
    "images/Z5 - Philippines - Octopus - 1.jpg",
  ],

  // E16 — The Fish Conference (Taiwan)
  E16: [
    "images/Z6 - Taiwan - The Fish Conference - 1.jpg",
    "images/Z6 - Taiwan - The Fish Conference - 2.jpg",
    "images/Z6 - Taiwan - The Fish Conference - 3.jpg",
  ],

  // E17 — Earthquake (Taiwan)
  E17: [
    "images/Z6 - Taiwan - Earthquake - 1.jpg",
  ],

  // E18 — Lab Day Off (Switzerland 3)
  E18: [
    "images/Z7 - Swiss - Lab Day Off - 1.jpg",
    "images/Z7 - Swiss - Lab Day Off - 2.jpg",
    "images/Z7 - Swiss - Lab Day Off - 3.jpg",
  ],

  // E19 — Getting Married (Switzerland 3)
  E19: [
    "images/Z7 - Swiss - Getting Married - 1.jpg",
    "images/Z7 - Swiss - Getting Married - 2.jpg",
  ],

  // E20 — Thesis Defended! (The Defense)
  E20: [
    "images/Thesis Defended! - 1.jpg",
  ],
};
