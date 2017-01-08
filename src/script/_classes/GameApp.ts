"use strict";
import BaseGameApp  = require("./lib/BaseGameApp");



/**
 * GameApp class
 */

class GameApp extends BaseGameApp {

  constructor(storyElement: string, displayElement=storyElement) {
    super(storyElement, displayElement);
    this.story.continue();
  }
}
export = GameApp;
