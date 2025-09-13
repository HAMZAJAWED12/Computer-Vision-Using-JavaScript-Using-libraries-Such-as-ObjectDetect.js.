class ImageOps {

  // grayscale then a little brighter
  makeGrayPlus20(img) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];

      let v = (r + g + b) / 3;
      v = v + v * 0.2;
      if (v > 255) v = 255;

      out.pixels[i] = v;
      out.pixels[i + 1] = v;
      out.pixels[i + 2] = v;
      out.pixels[i + 3] = 255;
    }
    out.updatePixels();
    return out;
  }

  // red / green / blue views
  splitIntoRGBChannels(img) {
    let rImg = createImage(img.width, img.height);
    let gImg = createImage(img.width, img.height);
    let bImg = createImage(img.width, img.height);

    img.loadPixels();
    rImg.loadPixels();
    gImg.loadPixels();
    bImg.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];

      rImg.pixels[i] = r; rImg.pixels[i + 1] = 0; rImg.pixels[i + 2] = 0; rImg.pixels[i + 3] = 255;
      gImg.pixels[i] = 0; gImg.pixels[i + 1] = g; gImg.pixels[i + 2] = 0; gImg.pixels[i + 3] = 255;
      bImg.pixels[i] = 0; bImg.pixels[i + 1] = 0; bImg.pixels[i + 2] = b; bImg.pixels[i + 3] = 255;
    }

    rImg.updatePixels();
    gImg.updatePixels();
    bImg.updatePixels();
    return { redImage: rImg, greenImage: gImg, blueImage: bImg };
  }

  // simple channel thresholds (tinted)
  thresholdRed(img, t) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i];
      if (r >= t) { out.pixels[i] = 255; out.pixels[i+1] = 0; out.pixels[i+2] = 0; }
      else        { out.pixels[i] =   0; out.pixels[i+1] = 0; out.pixels[i+2] = 0; }
      out.pixels[i+3] = 255;
    }
    out.updatePixels();
    return out;
  }
  thresholdGreen(img, t) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let g = img.pixels[i + 1];
      if (g >= t) { out.pixels[i] = 0; out.pixels[i+1] = 255; out.pixels[i+2] = 0; }
      else        { out.pixels[i] = 0; out.pixels[i+1] =   0; out.pixels[i+2] = 0; }
      out.pixels[i+3] = 255;
    }
    out.updatePixels();
    return out;
  }
  thresholdBlue(img, t) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let b = img.pixels[i + 2];
      if (b >= t) { out.pixels[i] = 0; out.pixels[i+1] = 0; out.pixels[i+2] = 255; }
      else        { out.pixels[i] = 0; out.pixels[i+1] = 0; out.pixels[i+2] =   0; }
      out.pixels[i+3] = 255;
    }
    out.updatePixels();
    return out;
  }

  // YCbCr view (packed into RGB so we can see it)
  makeYCbCrView(img) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];

      let y  = 0.299 * r + 0.587 * g + 0.114 * b;
      let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      if (y < 0) y = 0; if (y > 255) y = 255;
      if (cb < 0) cb = 0; if (cb > 255) cb = 255;
      if (cr < 0) cr = 0; if (cr > 255) cr = 255;

      out.pixels[i] = y;
      out.pixels[i + 1] = cb;
      out.pixels[i + 2] = cr;
      out.pixels[i + 3] = 255;
    }
    out.updatePixels();
    return out;
  }

  // Cr threshold -> grayscale (white if pass)
  thresholdYCbCr_CrGray(img, t) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];

      let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      let bw;
      if (cr >= t) bw = 255;
      else bw = 0;

      out.pixels[i] = bw;
      out.pixels[i + 1] = bw;
      out.pixels[i + 2] = bw;
      out.pixels[i + 3] = 255;
    }
    out.updatePixels();
    return out;
  }

  // HSV colour view (Travis): keep V, set S=1 so hue shows clearly
  makeHSVView(img) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i] / 255;
      let g = img.pixels[i + 1] / 255;
      let b = img.pixels[i + 2] / 255;

      let hsv = this.rgbToHsvTravis(r, g, b);
      let rgb = this.hsvToRgb(hsv.h, 1, hsv.v);

      out.pixels[i] = rgb[0];
      out.pixels[i + 1] = rgb[1];
      out.pixels[i + 2] = rgb[2];
      out.pixels[i + 3] = 255;
    }
    out.updatePixels();
    return out;
  }

  // HSV threshold (grayscale) using V channel
  thresholdHSV_V_Gray(img, t) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i] / 255;
      let g = img.pixels[i + 1] / 255;
      let b = img.pixels[i + 2] / 255;

      let hsv = this.rgbToHsvTravis(r, g, b);
      let v255 = hsv.v * 255;

      let bw;
      if (v255 >= t) bw = 255;
      else bw = 0;

      out.pixels[i] = bw;
      out.pixels[i + 1] = bw;
      out.pixels[i + 2] = bw;
      out.pixels[i + 3] = 255;
    }
    out.updatePixels();
    return out;
  }

  // HSV helpers (Travis)
  rgbToHsvTravis(r, g, b) {
    let mx = Math.max(r, g, b);
    let mn = Math.min(r, g, b);
    let d = mx - mn;

    let s;
    if (mx === 0) s = 0;
    else s = d / mx;

    let v = mx;

    let h = 0;
    if (d !== 0) {
      let rp = (mx - r) / d;
      let gp = (mx - g) / d;
      let bp = (mx - b) / d;

      if (r === mx && g === mn) h = 5 + bp;
      else if (r === mx && g !== mn) h = 1 - gp;
      else if (g === mx && b === mn) h = rp + 1;
      else if (g === mx && b !== mn) h = 3 - bp;
      else if (r === mx) h = 3 + gp;
      else h = 5 - rp;

      h = h * 60;
      if (h < 0) h += 360;
    }

    return { h: h, s: s, v: v };
  }

  hsvToRgb(h, s, v) {
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let rp = 0, gp = 0, bp = 0;

    if (h >= 0 && h < 60){ rp = c; gp = x; bp = 0; }
    else if (h < 120){ rp = x; gp = c; bp = 0; }
    else if (h < 180){ rp = 0; gp = c; bp = x; }
    else if (h < 240){ rp = 0; gp = x; bp = c; }
    else if (h < 300){ rp = x; gp = 0; bp = c; }
    else { rp = c; gp = 0; bp = x; }

    return [ (rp + m) * 255, (gp + m) * 255, (bp + m) * 255 ];
  }

  cropRect(img, box) {
    let out = createImage(box.w, box.h);
    out.copy(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    return out;
  }

  makeGray(img) {
    let out = createImage(img.width, img.height);
    img.loadPixels();
    out.loadPixels();

    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];
      let v = (r + g + b) / 3;

      out.pixels[i] = v;
      out.pixels[i + 1] = v;
      out.pixels[i + 2] = v;
      out.pixels[i + 3] = 255;
    }
    out.updatePixels();
    return out;
  }

  blur3x3(img) {
    let w = img.width;
    let h = img.height;
    let out = createImage(w, h);
    img.loadPixels();
    out.loadPixels();
  
    // 3x3 kernel (Gaussian-ish). You can swap to 1/9 box blur if you want.
      let k = [
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9]
    ];

  
    let size = 3;
    let off = 1; // center of 3x3
  
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
  
        let rSum = 0, gSum = 0, bSum = 0;
  
        // go over neighbors
        for (let j = 0; j < size; j++) {
          for (let i = 0; i < size; i++) {
            let xx = x + i - off;
            let yy = y + j - off;
  
            // clamp to image edges
            if (xx < 0) xx = 0;
            if (yy < 0) yy = 0;
            if (xx >= w) xx = w - 1;
            if (yy >= h) yy = h - 1;
  
            let idx = (xx + yy * w) * 4;
            let wt = k[j][i];
  
            rSum += img.pixels[idx] * wt;
            gSum += img.pixels[idx + 1] * wt;
            bSum += img.pixels[idx + 2] * wt;
          }
        }
  
        let o = (x + y * w) * 4;
        out.pixels[o] = rSum;
        out.pixels[o + 1] = gSum;
        out.pixels[o + 2] = bSum;
        out.pixels[o + 3] = 255;
      }
    }
  
    out.updatePixels();
    return out;
  }  

  pixelateBlocks(img, block) {
    if (block === undefined) block = 5;
    let w = img.width;
    let h = img.height;
    let out = createImage(w, h);
    img.loadPixels();
    out.loadPixels();

    for (let by = 0; by < h; by += block) {
      for (let bx = 0; bx < w; bx += block) {
        let sum = 0;
        let cnt = 0;

        for (let y = by; y < Math.min(by + block, h); y++) {
          for (let x = bx; x < Math.min(bx + block, w); x++) {
            let i = (x + y * w) * 4;
            let r = img.pixels[i];
            let g = img.pixels[i + 1];
            let b = img.pixels[i + 2];
            sum += (r + g + b) / 3;
            cnt++;
          }
        }
        let avg = sum / cnt;

        for (let y = by; y < Math.min(by + block, h); y++) {
          for (let x = bx; x < Math.min(bx + block, w); x++) {
            let o = (x + y * w) * 4;
            out.pixels[o] = avg;
            out.pixels[o + 1] = avg;
            out.pixels[o + 2] = avg;
            out.pixels[o + 3] = 255;
          }
        }
      }
    }
    out.updatePixels();
    return out;
  }
}
