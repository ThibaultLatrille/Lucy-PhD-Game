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
  // E0 — The Great Escape (Départ)
  E0: [
    "images/E0 - The Great Escape - 1.jpg",
  ],

  // E1 — Lab Outing (Switzerland 1)
  E1: [
    "images/E1 - Lab outing - 1.jpg",
    "images/E1 - Lab outing - 2.jpg",
  ],

  // E2 — An Unlikely Fight (Switzerland 1)
  E2: [
    "images/E2 - An Unlikely Fight - 1.jpg",
  ],

  // E3 — Rusty Diving Gear (Madagascar)
  E3: [
    "images/E3 - Rusty Diving Gear - 1.jpg",
  ],

  // E4 — Phone Stolen (Madagascar)
  E4: [
    "images/E4 - Phone Stolen - 1.jpg",
  ],

  // E5 — Food Poisoning (Madagascar)
  E5: [
    "images/E5 - Food Poisoning - 1.jpg",
  ],

  // E6 — The Jellyfish (Madagascar)
  E6: [
    "images/E6 - The Jellyfish - 1.jpg",
  ],

  // E7 — Fever & Dizziness (Madagascar)
  E7: [
    "images/E7 - Fever & Dizziness - 1.jpg",
  ],

  // E8 — Drinking Game (Thailand)
  E8: [
    "images/E8 - Thailand - Drinking game - 1.jpg",
    "images/E8 - Thailand - Drinking game - 2.jpg",
  ],

  // E9 — Cockroach Invasion (Switzerland 2)
  E9: [
    "images/E9 - Cockroach invasion - 1.jpg",
    "images/E9 - Cockroach invasion - 2.jpg",
    "images/E9 - Cockroach invasion - 3.jpg",
  ],

  // E10 — Proctoring an Exam (Switzerland 2)
  E10: [
    "images/E10 - Proctoring an Exam - 1.jpg",
  ],

  // E11 — Mid-Thesis (Switzerland 2)
  E11: [
    "images/E11 - Mid Thesis - 1.jpg",
  ],

  // E12 — Politician Threats (Philippines)
  E12: [
    "images/E12 - Politician threats - 1.jpg",
  ],

  // E13 — The Boat Breaks Down (Philippines)
  E13: [
    "images/E13 - The Boat Breaks Down - 1.jpg",
  ],

  // E14 — Work Blocked (Philippines)
  E14: [
    "images/E14 - Work Blocked - 1.jpg",
  ],

  // E15 — The Fish Conference (Taiwan)
  E15: [
    "images/E15 - The Fish Conference - 1.jpg",
    "images/E15 - The Fish Conference - 2.jpg",
    "images/E15 - The Fish Conference - 3.jpg",
  ],

  // E16 — Earthquake (Taiwan)
  E16: [
    "images/E16 - Earthquake - 1.jpg",
  ],

  // E17 — Lab Day Off (Switzerland 3)
  E17: [
    "images/E17 - Lab Day Off - 1.jpg",
    "images/E17 - Lab Day Off - 2.jpg",
    "images/E17 - Lab Day Off - 3.jpg",
  ],

  // E18 — Getting Married (Switzerland 3)
  E18: [
    "images/E18 - Getting Married - 1.jpg",
    "images/E18 - Getting Married - 2.jpg",
  ],

  // E19 — Thesis Defended! (The Defense)
  E19: [
    "images/E19 - Thesis Defended! - 1.jpg",
  ],
};
