// ================================
// Main sketch file
// ================================

// one global app object
let myApp;

function setup() {
  createCanvas(1000, 1100);
  pixelDensity(1);

  // make app and start it
  myApp = new FaceApp();
  myApp.init();
}

function draw() {
  // run the app draw loop
  myApp.draw();
}

function keyPressed() {
  // space key takes snapshot
  if (key === ' ') {
    myApp.takeSnapshot();
  }
  // pass key to app for face mode
  myApp.handleKey(key);
}

function mousePressed() {
  // if mouse is inside the live preview box (top-left),
  // then also take a snapshot
  if (mouseX >= 20 && mouseX <= 220 &&
      mouseY >= 20 && mouseY <= 170) {
    myApp.takeSnapshot();
  }
}