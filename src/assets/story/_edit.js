var editor,
    changed,
    lastTxt;

function init() {
  editor = document.getElementsByTagName("textarea")[0];
  if (editor) {
    changed = 0;
    lastTxt = editor.value;
    setInterval(tick, 10000);
    editor.addEventListener("keypress", keyPress);
    editor.addEventListener("keyup", keyUp);
  }
}
init();

function keyPress(e) {
  if (e.keyCode === 9) {
    insert("  ");
    e.preventDefault();
  }
}

function keyUp(e) {
  if (e.keyCode === 13) {
    var start = editor.selectionStart;
    var v = editor.value;
    var lastLine = v.substr(0, start).trim().split("\n").pop();
    var indent = lastLine.substr(0, lastLine.indexOf(lastLine.trim()));
    insert(indent);
  }
  if (editor.value !== lastTxt) {
    changed = 2;
  }
}

function tick() {
  if (changed > 0) {
    // changed = 1;
    $.post("?get=json&file="+filename, $(document.forms[0]).serialize(),
      function(data) {
        if (data.success) {
          changed--;
          console.log("saved");
        }
      }, "json");
  } else {
    $.get(filename+"?now="+Date.now(), function(data){
      if (changed === 0 && editor.value !== data) {
        editor.value = data;
        lastTxt = editor.value;
        console.log("loaded");
      }
    });
  }
}

function insert(txt) {
  var start = editor.selectionStart;
  var end = editor.selectionEnd;
  var v = editor.value;
  editor.value = v.substr(0, start) + txt + v.substr(end);
  editor.selectionEnd = editor.selectionStart = start + txt.length;
}