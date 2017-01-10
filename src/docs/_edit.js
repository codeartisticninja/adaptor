var editor,
    changed,
    lastTxt;

function init() {
  editor = document.getElementsByTagName("textarea")[0];
  if (editor) {
    changed = 0;
    lastTxt = editor.value;
    setInterval(tick, 10000);
    editor.addEventListener("keyup", keyUp);
  }
}
init();

function keyUp() {
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