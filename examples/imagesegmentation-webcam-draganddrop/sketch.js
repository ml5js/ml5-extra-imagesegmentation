// example by Zijin Huang

let img;
let maskedImg;
let segmentation;
let results;

let segmentImages = [];
let segmentHeight = 100;
let stickers = [];
let draggingSticker = null;
let selectedSticker = null;

let video;
let frame;

let captureBtn, enlargeBtn, shrinkBtn, createBubbleBtn, saveBtn;
let state = "camera"; // camera or sticker
let showCamera = true;

let bubbles = [];

function preload() {
  segmentation = ml5.imageSegmentation({ feature_extractor_size: 256 });
}

function setup() {
  createCanvas(800, 1600);

  captureBtn = createButton("capture");
  captureBtn.position(5, 15);
  captureBtn.mousePressed(segmentCurrentFrame);
  enlargeBtn = createButton("+");
  enlargeBtn.position(100, 15);
  enlargeBtn.mousePressed(() => resizeSticker(1.1));
  enlargeBtn.hide();

  shrinkBtn = createButton("-");
  shrinkBtn.position(150, 15);
  shrinkBtn.mousePressed(() => resizeSticker(0.9));
  shrinkBtn.hide();

  createBubbleBtn = createButton("Create Bubble");
  createBubbleBtn.position(200, 15);
  createBubbleBtn.mousePressed(createBubble);
  createBubbleBtn.hide();

  saveBtn = createButton("Save Image");
  saveBtn.position(320, 15);
  saveBtn.mousePressed(saveCanvasImage);
  saveBtn.hide();

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
}

function draw() {
  background(255);

  if (state == "camera") {
    image(video, 0, 0);
  } else if (state == "sticker") {
    displayStickers();
    displayBubbles();
  }
}

function gotResults(r) {
  results = r;

  results.forEach((segment) => {
    let maskedImg = frame.get();
    maskedImg.mask(segment.mask);

    let bbox = getBoundingBox(segment.mask);
    let croppedImg = maskedImg.get(bbox.x, bbox.y, bbox.w, bbox.h);

    segmentImages.push({
      img: croppedImg,
      label: segment.label,
      x: 0,
      y: 0,
      dialogue: "",
    });
  });

  goToStickerMode();
}

function getBoundingBox(mask) {
  mask.loadPixels();

  let xMin = mask.width,
    xMax = 0,
    yMin = mask.height,
    yMax = 0;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      let index = (y * mask.width + x) * 4;
      let alphaValue = mask.pixels[index + 3];
      if (alphaValue > 0) {
        // non-transparent pixel
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }

  let bboxWidth = xMax - xMin + 1;
  let bboxHeight = yMax - yMin + 1;

  return { x: xMin, y: yMin, w: bboxWidth, h: bboxHeight };
}

function segmentCurrentFrame() {
  showCamera = false;
  frame = video.get();
  image(frame, 0, 0);

  segmentation.detect(frame, gotResults);
}

function goToStickerMode() {
  if (segmentImages.length > 0) {
    state = "sticker";

    let margin = 10;
    let xOffset = margin;
    let yOffset = margin + 50;
    let canvasWidth = width;

    segmentImages.forEach((segment, index) => {
      let Oratio = segment.img.width / segment.img.height;
      let segmentWidth = segmentHeight * Oratio;

      if (xOffset + segmentWidth + margin > canvasWidth) {
        xOffset = margin;
        yOffset += segmentHeight + 30;
      }

      segment.x = xOffset;
      segment.y = yOffset;

      stickers.push({
        img: segment.img,
        x: segment.x,
        y: segment.y,
        w: segmentWidth,
        h: segmentHeight,
        dragging: false,
        dialogue: segment.dialogue,
      });

      xOffset += segmentWidth + margin;
    });

    enlargeBtn.show();
    shrinkBtn.show();
    createBubbleBtn.show();
    saveBtn.show();
  }
}

function displayStickers() {
  stickers.forEach((sticker) => {
    let mouseOverSticker =
      mouseX > sticker.x &&
      mouseX < sticker.x + sticker.w &&
      mouseY > sticker.y &&
      mouseY < sticker.y + sticker.h;

    if (mouseOverSticker || sticker.dragging) {
      tint(255, 80);
    } else {
      noTint();
    }

    image(sticker.img, sticker.x, sticker.y, sticker.w, sticker.h);

    if (sticker.dragging) {
      sticker.x = mouseX + sticker.dragOffsetX;
      sticker.y = mouseY + sticker.dragOffsetY;
    }
  });
}

function displayBubbles() {
  bubbles.forEach((bubble) => {
    drawDialogueBubble(bubble);

    if (bubble.dragging) {
      bubble.x = mouseX + bubble.dragOffsetX;
      bubble.y = mouseY + bubble.dragOffsetY;

      bubble.input.position(bubble.x + 10, bubble.y + 10);
    }
  });
}

function drawDialogueBubble(bubble) {
  let bubbleWidth = 150;
  let bubbleHeight = 50;

  fill(255);
  stroke(0);
  rect(bubble.x, bubble.y, bubbleWidth, bubbleHeight, 10);
}

function createBubble() {
  if (selectedSticker) {
    let bubble = {
      x: selectedSticker.x + selectedSticker.w + 10,
      y: selectedSticker.y - 20,
      dialogue: "",
      dragging: false,
      input: createInput(),
    };

    bubble.input.position(bubble.x + 10, bubble.y + 10);
    bubble.input.size(130);
    bubble.input.input(() => updateBubble(bubble));

    bubbles.push(bubble);
  }
}

function updateBubble(bubble) {
  bubble.dialogue = bubble.input.value();
}

function mousePressed() {
  // for drag stickers
  stickers.forEach((sticker) => {
    if (
      mouseX > sticker.x &&
      mouseX < sticker.x + sticker.w &&
      mouseY > sticker.y &&
      mouseY < sticker.y + sticker.h
    ) {
      sticker.dragging = true;
      sticker.dragOffsetX = sticker.x - mouseX;
      sticker.dragOffsetY = sticker.y - mouseY;

      selectedSticker = sticker;
    }
  });

  bubbles.forEach((bubble) => {
    if (
      mouseX > bubble.x &&
      mouseX < bubble.x + 150 &&
      mouseY > bubble.y &&
      mouseY < bubble.y + 50
    ) {
      bubble.dragging = true;
      bubble.dragOffsetX = bubble.x - mouseX;
      bubble.dragOffsetY = bubble.y - mouseY;
    }
  });
}

function mouseReleased() {
  stickers.forEach((sticker) => {
    sticker.dragging = false;
  });

  bubbles.forEach((bubble) => {
    bubble.dragging = false;
  });
}

function resizeSticker(scaleFactor) {
  if (selectedSticker) {
    selectedSticker.w *= scaleFactor;
    selectedSticker.h *= scaleFactor;
  }
}

function saveCanvasImage() {
  saveCanvas("myStory", "png");
}
