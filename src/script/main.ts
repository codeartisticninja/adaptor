"use strict";
import GameApp  = require("./_classes/GameApp");

/**
 * main.ts
 * Main script
 */
var game: GameApp,
    gameContainer: HTMLElement,
    information: HTMLElement;

function init() {
  gameContainer = document.getElementById("game");
  information = document.getElementsByTagName("article")[0];

  game = window["game"] = new GameApp("#story", ".passage");
}

if (location.search === "?nojs") {
  let tags = document.getElementsByTagName("noscript");
  for (let i = 0; i < tags.length; i++) {
    let tag = document.createElement("span");
    tag.classList.add("noscript");
    tag.innerHTML = tags[i].innerHTML;
    tags[i].parentElement.insertBefore(tag, tags[i]);
  }
} else {
  addEventListener("DOMContentLoaded", init);
}
