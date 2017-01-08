"use strict";
import Teller = require("./Teller");

/**
 * WebStory class
 * 
 * @date 08-01-2017
 */

 var _nextChoiceId=0;

class WebStory {
  tellers:Object;
  currentTeller:Teller;
  storyElement:HTMLElement;
  displayElement:HTMLElement;
  currentElement:HTMLElement;
  nextElement:HTMLElement;
  callStack:HTMLElement[]
  passageSelector:string;
  choiceSelector:string;

  impatience:number;

  constructor(storyElement:HTMLElement|string, displayElement=storyElement) {
    if (typeof storyElement === "string") {
      this.storyElement = <HTMLElement>document.querySelector(storyElement);
    } else {
      this.storyElement = storyElement;
    }
    if (typeof displayElement === "string") {
      this.displayElement = <HTMLElement>document.querySelector(displayElement);
    } else {
      this.displayElement = displayElement;
    }
    // this.storyElement = <HTMLElement>document.importNode(this.storyElement, true);
    this.displayElement.innerHTML = "";

    this._startScrolling = this._startScrolling.bind(this);
    this._getImpatient = this._getImpatient.bind(this);
    this._$ = this._$.bind(this);
    document.addEventListener("keydown", this._getImpatient);
    document.addEventListener("mousedown", this._getImpatient);
    document.addEventListener("wheel", this._getImpatient);
    document.addEventListener("touchstart", this._getImpatient);

    this.tellers = {};
    this.callStack = [];
    this.nextElement = <HTMLElement>this.storyElement.firstElementChild;
  }

  continue(currentTeller?:Teller) {
    if (currentTeller && this.currentTeller === currentTeller) {
      this.currentTeller = null;
    }
    if (!this.currentTeller) {
      this.currentElement = this.nextElement || this.callStack.pop();
      if (this.currentElement) {
        if (this.choiceSelector) {
          var els = this.currentElement.querySelectorAll(this.choiceSelector);
          for (var i=0;i<els.length;i++) {
            if (!els.item(i).id) {
              els.item(i).setAttribute("id", "choice-"+(_nextChoiceId++));
            }
          }
        }
        this.nextElement = <HTMLElement>this.currentElement.nextElementSibling;
        var element = <HTMLElement>document.importNode(this.currentElement, true);
        if (this.choiceSelector) {
          var tmpStorage:string[] = [];
          var els = element.querySelectorAll(this.choiceSelector);
          for (var i=0;i<els.length;i++) {
            els.item(i).innerHTML = "" + (tmpStorage.push(els.item(i).innerHTML)-1);
          }
        }
        element.innerHTML = this._preProcess(element.innerHTML);
        if (this.choiceSelector) {
          var els = element.querySelectorAll(this.choiceSelector);
          for (var i=0;i<els.length;i++) {
            els.item(i).innerHTML = tmpStorage[parseInt(els.item(i).innerHTML)];
          }
        }
        this._showElement(element);
        var tellerCandidate:typeof Teller;
        for (var selector in this.tellers) {
          if (this.currentElement.matches(selector)) {
            tellerCandidate = this.tellers[selector];
          }
        }
        if (tellerCandidate) {
          this.currentTeller = new tellerCandidate(this, element);
        } else {
          setTimeout(()=>{ this.continue(); }, 128);
        }
      } else {
        console.log("END OF STORY!!");
      }
    }
  }

  newSection(selector=this.passageSelector) {
    if (!selector) return;
    var section:HTMLElement;
    var el:HTMLElement
    while (!section || !section.matches(selector)) {
      el = section;
      section = <HTMLElement>document.importNode(this.displayElement, false);
      section.removeAttribute("id");
      if (el) {
        section.appendChild(el);
      }
      this.displayElement = this.displayElement.parentElement;
    }
    if (section) {
      this._showElement(section);
      this.displayElement = section;
      while(this.displayElement.firstElementChild) {
        this.displayElement = <HTMLElement>this.displayElement.firstElementChild;
      }
      return section;
    }
  }

  goTo(section:HTMLElement|string, currentTeller:Teller) {
    if (this.currentTeller === currentTeller) {
      var el = <HTMLElement>this._getElement(section);
      el.dataset["_visits"] = el.dataset["_visits"] || "0";
      el.dataset["_visits"] = "" + (parseInt(el.dataset["_visits"]) + 1);
      this.nextElement = <HTMLElement>el.firstElementChild;
      this.impatience = 0;
      return this.continue(currentTeller);
    }
  }

  goSub(section:HTMLElement|string, currentTeller:Teller) {
    if (this.currentTeller === currentTeller) {
      if (this.currentElement.nextElementSibling) this.callStack.push(<HTMLElement>this.currentElement.nextElementSibling);
      return this.goTo(section, currentTeller);
    }
  }

  return(currentTeller:Teller) {
    if (this.currentTeller === currentTeller) {
      this.nextElement = this.callStack.pop();
      return this.continue(currentTeller);
    }
  }

  get(varName:string, returnElement=false):any {
    var el = this.currentElement;
    if (varName.trim().substr(-1) === "]") {
      var parts = varName.trim().split("[");
      varName = parts.pop().replace("]", "");
      var selector = parts.join("[");
      el = <HTMLElement>this._getElement(selector);
    }
    while (el.dataset[varName] == null && el.parentElement) {
      el = el.parentElement;
    }
    if (returnElement) {
      if (el.dataset[varName] == null) el = this.currentElement.parentElement;
      return el;
    } else {
      return this._jsonParse(el.dataset[varName]);
    }
  }

  set(varName:string, value:any) {
    this.get(varName, true).dataset[varName] = JSON.stringify(value);
  }

  alter(varName:string, value:any) {
    this.set(varName, this.get(varName) + value);
  }

  addTeller(selector:string, teller:typeof Teller) {
    this.tellers[selector] = teller;
  }

  removeTeller(teller:typeof Teller) {
    for (var selector in this.tellers) {
      if (this.tellers[selector] === teller) {
        this.tellers[selector] = undefined;
      }
    }
  }

  /*
    _privates
  */
  private _scrollTO:any;
  private _scrollSpeed=0;
  private _scrollInertia=.01;
  private _scrollBuffer=0;
  private _lastScrollTime:number;

  private _showElement(child:HTMLElement) {
    child.classList.add("hidden");
    setTimeout(function(){ child.classList.remove("hidden"); }, 50);
    this.displayElement.appendChild(child);
    setTimeout(this._startScrolling, 50);
    return child;
  }

  private _startScrolling(t?:number) {
    cancelAnimationFrame(this._scrollTO);
    var tDelta = 16,i=1;
    if (t && this._lastScrollTime) tDelta = t - this._lastScrollTime;
    this._lastScrollTime = t;

    var ahead = this._leftToScroll();
    var maxSpeed = 0;
    if (ahead === 0) {
      return this.currentTeller&&this.currentTeller.goOn();
    }
    while (ahead > 0) {
      maxSpeed += this._scrollInertia;
      ahead -= maxSpeed;
    }
    while(tDelta>0) {
      tDelta-=17;
      this._scrollSpeed = Math.min(maxSpeed, this._scrollSpeed + this._scrollInertia);
      this._scrollBuffer += this._scrollSpeed;
    }
    if (this._scrollBuffer >= 1) {
      var el = this.displayElement;
      while (el) {
        el.scrollTop += Math.floor(this._scrollBuffer);
        el = el.parentElement;
      }
      // window.scrollBy(0, Math.floor(this._scrollBuffer));
      this._scrollBuffer -= Math.floor(this._scrollBuffer);
    }
    this._scrollTO = requestAnimationFrame(this._startScrolling);
  }

  private _leftToScroll() {
    var rest = 0, old=0;
    var el = <HTMLElement>this.displayElement;
    while (el) {
      old = el.scrollTop;
      el.scrollTop += el.scrollHeight;
      rest += el.scrollTop - old;
      el.scrollTop = old;
      el = el.parentElement;
    }
    return rest;
  }

  private _getImpatient() {
    cancelAnimationFrame(this._scrollTO);
    this._scrollSpeed = 0;
    this._scrollBuffer = 0;
    this.impatience++;
    if (this.currentTeller) {
      this.currentTeller.hurry();
    }
  }

  private _getElement(selector:string|HTMLElement, context?:HTMLElement) {
    context = context || this.currentElement || this.storyElement || document.body;
    if (typeof selector === "string") {
      if (selector.trim().substr(0, 1) === "#") {
        context = this.storyElement;
      }
      while (selector.trim().substr(0, 3) === ".. ") {
        selector = selector.trim().substr(3);
        context = context.parentElement;
      }
      return context.querySelector(selector);
    } else {
      return selector;
    }
  }

  private _preProcess(html:string) {
    var $ = this._$;

    var brackStart = html.indexOf("{{");
    var brackEnd=-1;
    var brack="";
    while (brackStart !== -1) {
      brackEnd = html.indexOf("}}", brackStart);
      brack = html.substring(brackStart+2, brackEnd);

      brack = eval(this._htmlDequote(this._escapeHTML(brack)));
      if (brack == null) {
        brack = "";
      } else {
        brack = "" + brack;
      }

      html = html.substring(0, brackStart) + brack + html.substr(brackEnd+2);
      brackStart = html.indexOf("{{", brackStart+brack.length);
    }

    brackStart = html.indexOf("{");
    brackEnd=-1;
    brack="";
    while (brackStart !== -1) {
      brackEnd = html.indexOf("}", brackStart);
      brack = html.substring(brackStart+1, brackEnd);

      brack = this._smartTag(brack);

      html = html.substring(0, brackStart) + brack + html.substr(brackEnd+1);
      brackStart = html.indexOf("{", brackStart+brack.length);
    }
    return html;
  }

  private _escapeHTML(js:string) {
    var brackStart = js.indexOf("[[");
    var brackEnd=-1;
    var brack="";
    while (brackStart !== -1) {
      brackEnd = js.indexOf("]]", brackStart);
      brack = js.substring(brackStart+2, brackEnd).trim();

      brack = this._htmlQuote(JSON.stringify(brack));

      js = js.substring(0, brackStart) + brack + js.substr(brackEnd+2);
      brackStart = js.indexOf("[[", brackStart+brack.length);
    }
    return js;
  }

  private _smartTag(tag:string) {
    var parts = tag.split("|");
    if (parts[0].substr(0,1) === "$") {
      parts[0] = parts[0].substr(1);
      tag = this.get(parts[0]);
      if (parts.length === 2) {
        this.set(parts[0], this._jsonParse(parts[1]));
      } else
      if (parts.length > 2) {
        var r = eval(JSON.stringify(tag) + parts[1]);
        if (r) {
          tag = parts[2] || "";
        } else {
          tag = parts[3] || "";
        }
      }
    } else
    if (parts[0].substr(0,1) === "~") {
      parts[0] = parts[0].substr(1);
      tag = parts[Math.floor(Math.random()*parts.length)];
    } else
    if (parts[0].substr(0,5) === "&amp;") {
      parts[0] = parts[0].substr(5);
      tag = parts[(this.get("_visits")-1) % parts.length];
    } else
    if (parts[0].substr(0,1) === "&") {
      parts[0] = parts[0].substr(1);
      tag = parts[(this.get("_visits")-1) % parts.length];
    } else {
      tag = parts[Math.min((this.get("_visits")-1), parts.length-1)];
    }
    return ""+tag;
  }

  private _htmlQuote(str:string) {
    var d = document.createElement("textarea");
    d.textContent = str;
    return d.innerHTML;
  }

  private _htmlDequote(str:string) {
    var d = document.createElement("textarea");
    d.innerHTML = str;
    return d.textContent;
  }

  private _$(varName:string, value?:any, alter?:boolean) {
    if (alter) {
      return this.alter(varName, value);
    } else
    if (value !== undefined) {
      return this.set(varName, value);
    } else {
      return this.get(varName);
    }
  }

  private _jsonParse(str:string) {
    try {
      return JSON.parse(str);
    } catch(e) {
      return str;
    }
  }
}
export = WebStory;
