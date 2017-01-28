"use strict";
import BaseGameApp  = require("./lib/BaseGameApp");



/**
 * GameApp class
 */

class GameApp extends BaseGameApp {

  constructor(storyElement: string, displayElement=storyElement) {
    super(storyElement, displayElement);
    var startBtn = document.createElement("button");
    startBtn.textContent = "Begin";
    startBtn.addEventListener("click", ()=>{
      startBtn.style.display = "none";
      startBtn.disabled = true;
      (<HTMLElement>document.querySelector("#display")).removeAttribute("style");
      this.story.continue();
    });
    document.querySelector("article").appendChild(startBtn);
    requestAnimationFrame(()=>{
      startBtn.focus();
    });
    (<HTMLElement>document.querySelector("#display")).style.display = "none";
  }
}
export = GameApp;
