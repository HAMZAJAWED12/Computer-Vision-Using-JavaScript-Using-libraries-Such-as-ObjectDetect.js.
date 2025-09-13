/*
========================
Brief Commentary 
========================

RGB thresholding – what I saw:
When I move the sliders for R, G and B, the images behave differently. The R (red) threshold usually shows skin and faces more strongly. That is because human skin has a good amount of red, so many skin pixels cross the red threshold earlier. 
The G (green) threshold looks sharper on edges sometimes (lots of cameras have strong green in the Bayer pattern), but it also keeps lots of background (plants, walls, etc.), so it can be noisy. The B (blue) threshold is the noisiest in indoor light for me. 
Blue channel is darker and grainier, so fewer pixels cross the blue threshold, and small sensor noise shows up more.

Colour spaces vs RGB (Cr and V):
The Cr threshold (from YCbCr) is better for picking out warm/skin tones because Cr measures the “redness” independent of brightness. 
That means light/shadow changes affect it less than plain R. The V threshold (from HSV) reacts to overall brightness. 
With a low slider value the whole frame turns white (as required), and at high values it turns black. 
V is useful for quick light/dark separation but not for color-based picking (it ignores hue). 
Overall, Cr gave me cleaner masks for skin than raw R because it reduces brightness effects; V is good for simple luminance control but not specific to skin.

Face detection area + filters:
After I freeze the snapshot, I can replace the content inside the detected face box with: gray, blur, HSV view, or pixelate. 
Blur uses a simple box blur (convolution) so it’s easy to follow. Pixelate averages small blocks. These filters are basic but show the idea clearly.

Extension: Face → Sound Visualizer (why it’s unique):
I added a small “Extension” tile that maps the live face box to sound. Face width changes the pitch (bigger face = closer = higher pitch), and face height changes the volume (top is louder). 
I also draw moving bars so there is an immediate visual cue when sound is on. It is simple, interactive, and linked to the vision output, so it feels like a tiny instrument controlled by your face. 
It is different from the usual image filters and shows a cross-modal idea (vision to audio).

Issues I hit and how I fixed them:
1) HSV threshold direction: I made sure 0 → white and 255 → black by mapping against V as specified.
2) YCbCr ranges: I clamped Y, Cb, Cr into 0–255 so the view tiles display correctly.
3) Audio startup: browsers block audio until a user gesture. I added a button to “Enable Sound” and only then start the oscillator/gain.

What I learned:
RGB channels behave differently in real scenes, and colour spaces can make thresholding more stable. Keeping the code simple (clear names and small steps) made debugging faster.
*/


class FaceApp {
  constructor() {
    this.webcam = null;
    this.ops = new ImageOps();

    this.rSlider = null;
    this.gSlider = null;
    this.bSlider = null;
    this.crSlider = null; // Cr threshold (YCbCr) 
    this.hSlider = null;  // V threshold (HSV)  
    this.snapshot = null;
    this.liveFaceBox = null;
    this.frozenFaceBox = null;

    this.faceMode = 0;

    this.detector = null;
    this.tmp160x120 = null;

   
    this.soundBtn = null;
    this.music = null;    
    this.soundReady = false;
    this.soundOn = false;  
  }

  init() {
    this.webcam = createCapture(VIDEO);
    this.webcam.hide();

    this.rSlider = createSlider(0, 255, 128, 1); this.rSlider.position(20, 370);
    this.gSlider = createSlider(0, 255, 128, 1); this.gSlider.position(275, 370);
    this.bSlider = createSlider(0, 255, 128, 1); this.bSlider.position(520, 370);

    this.crSlider = createSlider(0, 255, 128, 1); this.crSlider.position(275, 730);
    this.hSlider  = createSlider(0, 255, 128, 1); this.hSlider.position(520, 730);

    let W = 160, H = 120, S = 2;
    this.detector = new objectdetect.detector(W, H, S, objectdetect.frontalface);
    this.tmp160x120 = createImage(W, H);

    // simple sound enable button
    this.soundBtn = createButton('Enable Sound');
    this.soundBtn.position(775, 360);
    this.soundBtn.mousePressed(() => {
      // user gesture -> resume audio, then load+loop music
      try { getAudioContext().resume(); } catch (e) {}
      if (!this.music) {
        // load once, then loop quietly at start
        soundFormats('mp3');
        this.music = loadSound('tracks/electro_smash.mp3', () => {
          this.music.setVolume(0);
          this.music.loop();
          this.soundReady = true;
        });
      } else {
        // already loaded earlier
        if (!this.music.isPlaying()) this.music.loop();
        this.soundReady = true;
      }
    });

    textFont('sans-serif');
  }

  handleKey(k) {
    if (k === '0') this.faceMode = 0;
    if (k === '1') this.faceMode = 1;
    if (k === '2') this.faceMode = 2;
    if (k === '3') this.faceMode = 3;
    if (k === '4') this.faceMode = 4;
    if (k === 's' || k === 'S') this.soundOn = !this.soundOn; // toggle sound control
  }

  takeSnapshot() {
    let f = this.grabWebcamFrame160x120();
    this.snapshot = createImage(f.width, f.height);
    this.snapshot.copy(f, 0, 0, f.width, f.height, 0, 0, f.width, f.height);

    if (this.liveFaceBox) {
      this.frozenFaceBox = {
        x: this.liveFaceBox.x,
        y: this.liveFaceBox.y,
        w: this.liveFaceBox.w,
        h: this.liveFaceBox.h
      };
    } else {
      this.frozenFaceBox = null;
    }
  }

  draw() {
    background('gray');

    noStroke();
    fill(255);
    textSize(30);
    text('Final Face Detection Project', width / 2 + 60, 100);

    image(this.webcam, 20, 20, 200, 150);
    this.updateLiveFaceBox();

    if (this.liveFaceBox) {
      let sx = 200 / 160;
      let sy = 150 / 120;
      noFill();
      stroke(0, 255, 0);
      strokeWeight(2);
      rect(20 + this.liveFaceBox.x * sx,
           20 + this.liveFaceBox.y * sy,
           this.liveFaceBox.w * sx,
           this.liveFaceBox.h * sy);
      noStroke(); fill(0); textSize(12);
      text('Live Face Box (press Space to freeze)', 20, 15);
    } else {
      noStroke(); fill(0); textSize(12);
      text('No live face found. Try more light / move closer.', 20, 15);
    }

    let src = this.snapshot;

    if (src) {
      image(this.ops.makeGrayPlus20(src), 275, 20, 200, 150);
    } else {
      fill(255); rect(275, 20, 200, 150);
      fill(0); textSize(14);
      text('Press Space / Click live\n to take snapshot', 285, 95);
    }

    for (let r = 0; r < 4; r++) {
      fill('white');
      rect(20,  200 + r * 180, 200, 150);
      rect(275, 200 + r * 180, 200, 150);
      rect(520, 200 + r * 180, 200, 150);
    }

    fill('white');
    rect(775, 200, 200, 150);
    fill(0);
    textSize(14);
    text('Extension', 775, 190);
    this.drawFaceToSoundTile(775, 200, 200, 150);

    if (!src) {
      fill(0); textSize(14);
      text('Take a snapshot to see results', 25, 215);
      text('Take a snapshot to see results', 280, 215);
      text('Take a snapshot to see results', 525, 215);
      text('…', 25, 395); text('…', 280, 395); text('…', 525, 395);
      text('Click live tile or press Space', 20, 555);
      return;
    }

    // row 1
    let ch = this.ops.splitIntoRGBChannels(src);
    image(ch.redImage,   20,  200, 200, 150);
    image(ch.greenImage, 275, 200, 200, 150);
    image(ch.blueImage,  520, 200, 200, 150);

    // row 2
    let rT = this.rSlider.value();
    let gT = this.gSlider.value();
    let bT = this.bSlider.value();
    image(this.ops.thresholdRed(src,   rT), 20,  380, 200, 150);
    image(this.ops.thresholdGreen(src, gT), 275, 380, 200, 150);
    image(this.ops.thresholdBlue(src,  bT), 520, 380, 200, 150);
    noStroke(); fill(0); textSize(14);
    text('R threshold: ' + rT, 20, 365);
    text('G threshold: ' + gT, 275, 365);
    text('B threshold: ' + bT, 520, 365);

    // row 3 (views)
    image(src,                        20, 560, 200, 150);
    image(this.ops.makeYCbCrView(src),275, 560, 200, 150);
    image(this.ops.makeHSVView(src),  520, 560, 200, 150);
    fill(0);
    text('Snapshot (static source)', 20, 555);
    text('Colour space 1: YCbCr',   275, 555);
    text('Colour space 2: HSV',     520, 555);

    // row 4 (grayscale thresholds)
    let crT = this.crSlider.value();
    let vT  = this.hSlider.value();
    image(this.ops.thresholdYCbCr_CrGray(src, crT), 275, 740, 200, 150);
    image(this.ops.thresholdHSV_V_Gray(src,  vT),   520, 740, 200, 150);
    fill(0);
    text('Cr threshold (gray): ' + crT, 275, 725);
    text('HSV V threshold (gray): ' + vT, 520, 725);

    // face box tile
    let fx = 20, fy = 740, fw = 200, fh = 150;
    image(src, fx, fy, fw, fh);

    if (this.frozenFaceBox) {
      let sx = fw / src.width;
      let sy = fh / src.height;

      noFill(); stroke(255, 0, 0); strokeWeight(2);
      rect(fx + this.frozenFaceBox.x * sx,
           fy + this.frozenFaceBox.y * sy,
           this.frozenFaceBox.w * sx,
           this.frozenFaceBox.h * sy);

      if (this.faceMode !== 0) {
        let roi = this.ops.cropRect(src, this.frozenFaceBox);
        let rep = null;
        if (this.faceMode === 1) rep = this.ops.makeGray(roi);
        else if (this.faceMode === 2) rep = this.ops.blur3x3(roi);
        else if (this.faceMode === 3) rep = this.ops.makeHSVView(roi);
        else if (this.faceMode === 4) rep = this.ops.pixelateBlocks(roi, 5);

        if (rep) {
          image(rep,
                fx + this.frozenFaceBox.x * sx,
                fy + this.frozenFaceBox.y * sy,
                this.frozenFaceBox.w * sx,
                this.frozenFaceBox.h * sy);
        }
      }

      noStroke(); fill(0);
      text('Face (0=box, 1=gray, 2=blur, 3=HSV, 4=pixel)', fx, fy + 200);
      text('Tip: line up face, then press Space', fx, fy + fh + 15);
    } else {
      noStroke(); fill(0);
      text('No frozen face. Press Space on a good frame.', fx, fy - 5);
      text('Keys: 0..4 to try the filters', fx, fy + fh + 15);
    }
  }

  // extension: face -> music (volume + speed)
  drawFaceToSoundTile(x, y, w, h) {
    fill(0);
    textSize(12);
    text('Face → Music (press S)', x + 5, y + 15);

    noStroke();
    fill(240);
    rect(x + 10, y + 25, w - 20, h - 35);

    // info if not ready
    if (!this.soundReady) {
      fill(0);
      text('Click "Enable Sound"', x + 15, y + h/2);
      return;
    }

    // simple mapping only when soundOn
    let hasFace = !!this.liveFaceBox;
    let vol = 0;    // 0..1
    let rate = 1;   // playback rate

    if (hasFace && this.soundOn && this.music) {
      // bigger face -> louder
      vol = map(this.liveFaceBox.w, 20, 160, 0.05, 0.9, true);
      // higher face -> faster (top is higher pitch)
      rate = map(this.liveFaceBox.y, 0, 120, 1.4, 0.7, true);

      this.music.setVolume(vol, 0.05);
      this.music.rate(rate);
    } else if (this.music) {
      this.music.setVolume(0, 0.05);
    }

    // tiny bars viz
    let bars = 14;
    let barW = (w - 40) / bars;
    let center = y + 25 + (h - 45) / 2;
    for (let i = 0; i < bars; i++) {
      let t = i / (bars - 1);
      let a = (this.soundOn && hasFace) ? vol : 0.05;
      let hh = a * (h - 45) * (0.3 + 0.7 * sin(TWO_PI * (t + frameCount * 0.01)));
      fill(50);
      rect(x + 20 + i * barW, center - hh/2, barW * 0.8, hh);
    }

    fill(0);
    textSize(11);
    if (this.soundOn && hasFace) {
      text('vol: ' + nf(vol, 1, 2) + ' | rate: ' + nf(rate, 1, 2), x + 14, y + h - 12);
    } else if (this.soundOn) {
      text('vol: 0.00 | rate: -- (no face)', x + 14, y + h - 12);
    } else {
      text('sound off (S)', x + 14, y + h - 12);
    }
  }

  updateLiveFaceBox() {
    this.tmp160x120.copy(this.webcam,
                         0, 0, this.webcam.width, this.webcam.height,
                         0, 0, this.tmp160x120.width, this.tmp160x120.height);

    let faces = this.detector.detect(this.tmp160x120.canvas);

    let best = null;
    for (let i = 0; i < faces.length; i++) {
      let f = faces[i];
      if (f[4] > 3) {
        let area = f[2] * f[3];
        if (best === null || area > best.area) {
          best = { x: f[0], y: f[1], w: f[2], h: f[3], area: area };
        }
      }
    }
    if (best) this.liveFaceBox = { x: best.x, y: best.y, w: best.w, h: best.h };
    else this.liveFaceBox = null;
  }

  grabWebcamFrame160x120() {
    let f = this.webcam.get();
    f.resize(160, 120);
    return f;
  }
}