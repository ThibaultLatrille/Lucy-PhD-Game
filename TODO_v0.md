We are preparing to celebrate Lucy PhD defense, for this we want to build a website that we can use for a presentation.
Create a website page to play Lucy's PhD game.
The goal of the game is the following:

- The player is Lucy, a PhD student, and the goal is to finish her PhD and defend her thesis.
- It is a board game with a fix number of tiles.
- You draw a dice to determine how many tiles you move forward.
- You start at the first tile, and you need to reach the last tile.
- Some tiles have no events, and some tiles have events.
- Some tiles have a event that can either help you, hinder your progress or is a story moment (you don't move but a specific message is displayed).
- The board contains a total of 48 tiles, and the events are distributed along the tiles.
- You draw a dice to determine how many tiles you move forward.
- The player is Lucy, a PhD student, and the goal is to finish her PhD and defend her thesis.
- With each mouse click on the button to roll dice, the player rolls the dice and moves forward accordingly.
- The dice roll can be bet ween 1 and 6, and is animated to show the rolling effect.
- The tiles are displayed as linear, and the player moves along the path.
- Don't use number inside of tiles, show as an arrow or as a line the journey along the tiles.
- The list of events is provided in the Lucy-list.md file (containing events that happened to Lucy during her PhD).
- Falling on a event makes the player execute the move (hinder, boost), regardless of how the player ended in the tile (dice roll or due to a hindrance/boost from another event)
- The game is actually not random, the events are pre-determined and are based on real events that happened to Lucy during her PhD.
- In this game, the path is deterministic with a predetermined chain of dice rolls, and the player will always encounter all the same events in the same order. Importantly, the player will encounter all events (none are skipped), and each event only once. This is to show Lucy's journey and all the events that she encountered.
- The deterministic chain of dice rolls should not only visit the tiles with events that triggers the pop-up, but also some tiles without events, where nothing happens.
- When discovering an event, an animation should be displayed to show the event and its effect on the player (e.g., a pop-up or a modal).
- When nothing happens (tiles without events), still show a modal stating you can breath and continue your journey.
- When the player reaches the last tile, a congratulatory message should be displayed to celebrate Lucy's PhD defense.
- Visually, the board should not be a square/rectangle, but instead it should be a path that looks like an adventur, a journey (more or less like a river path or a snake board). Tiles are placed at hand-tuned grid coordinates to form an organic winding road. More 'adventure' look.
- The events are actually in order, but most importantly they are clustered as categories (e.g. Switzerland, Madagascar, ...), look-up all the categories from the list of events (Lucy-list.md file) and also find a way to visually signal these categories in the board (for example with images, text, flag, in the background encompassing all tiles in this categories). It is used for the narrative of how Lucy got into the different moments of her PhD. Distinct background tint per category zone. Each category's tiles share a colored background/border so the region is obvious at a glance., Chapter banner with flag + name at the start of each zone - A small label (e.g. 🇲🇬 Madagascar) placed at the entry of each category region.
- In the deterministic path, try to get once a roll of dice that makes you fall on a hindrance (pushing you back) that makes you fall directly on another hindrance, so that an hindrance that you managed to skip in previous dice roll will actually be triggered.

Create a proof of concept and generate these three files:

- main.html that will be the main page of the game.
- assets/script.js that will contain the game logic.
- assets/style.css that will contain the game styles.
  You can use any libraries or frameworks you want, but make sure to document them and provide clear explanations for their use.

Run and test the implemented changes.
Make sure the game is working well and tested locally.

When coding in javascript, do not use try/catch statements unless there is no other solutions.
