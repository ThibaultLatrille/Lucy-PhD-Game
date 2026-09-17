We are preparing to celebrate Lucy PhD defense, for this we want to build a website that we can use for a presentation.
Create a website page to play Lucy's PhD game.
The goal of the game is the following:

- It is a board game with a fix number of tiles.
- You start at the first tile, and you need to reach the last tile.
- Each tile has a random event that can either help you or hinder your progress.
- You draw a dice to determine how many tiles you move forward.
- The player is Lucy, a PhD student, and the goal is to finish her PhD and defend her thesis.
- With each mouse click, the player rolls the dice and moves forward accordingly.
- The dice roll can be bet ween 1 and 6, and is animated to show the rolling effect (if possible).
- The tiles are displayed as linear, and the player moves along the path.
- The board contains a total of 48 tiles, and the events are distributed along the tiles.
- Don't use number inside of tiles, show as an arrow or as a line the journey along the tiles.
- Some tiles have no events, and some tiles have events.
- The list of events is provided in the Lucy-list.md file (containing 15 events that happened to Lucy during her PhD).
- The game is actually not random, the events are pre-determined and are based on real events that happened to Lucy during her PhD.
- The path is deterministic, and the player will always encounter the same events in the same order.
- The deterministic chain of dice rolls should not only visit the tiles with events that triggers the pop-up, but also the tiles without events, where nothing happens.
- When discovering an event, an animation should be displayed to show the event and its effect on the player (e.g., a pop-up or a modal).
- When nothing happens (tiles without events), still show a modal stating you can breath and continue your journey.
- When the player reaches the last tile, a congratulatory message should be displayed to celebrate Lucy's PhD defense.

This a proof of concept that contains these three files:

- main.html that will be the main page of the game.
- assets/script.js that will contain the game logic.
- assets/style.css that will contain the game styles.
  You can use any libraries or frameworks you want, but make sure to document them and provide clear explanations for their use.

Read the files in depth to understand the content of the game already implemented.
Now do the following and fix the following issues:

- Put the baord as

Run and test the implemented changes.
Make sure the game is working well and tested locally.

When coding in javascript, do not use try/catch statements unless there is no other solutions.
