// example by Zijin Huang

let img;
let maskedImg;
let segmentation;
let results;

let segments = [];
let clickedSegments = [];
let bubbles = [];
let video;
let frame;

let captureBtn, resetBtn, createBubbleBtn, submitBtn;
let inputBox;
let state = "camera";
let showCamera = true;

let maxSelections = 4;
let selectedCount = 0;

let draggedBubble = null;
let offsetX, offsetY;

function preload() {
  segmentation = ml5.imageSegmentation({ feature_extractor_size: 256 });
}

function setup() {
  createCanvas(640, 480);

  captureBtn = createButton("capture");
  captureBtn.position(10, 500);
  captureBtn.mousePressed(segmentCurrentFrame);

  resetBtn = createButton("reset");
  resetBtn.position(100, 500);
  resetBtn.mousePressed(resetCamera);
  resetBtn.hide();

  createBubbleBtn = createButton("Create Bubble");
  createBubbleBtn.position(200, 500);
  createBubbleBtn.mousePressed(showInputBox);
  createBubbleBtn.hide();

  inputBox = createInput("");
  inputBox.position(10, 550);
  inputBox.size(200, 30);
  inputBox.hide();

  submitBtn = createButton("Submit");
  submitBtn.position(220, 550);
  submitBtn.mousePressed(submitBubbleText);
  submitBtn.hide();

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
}

function draw() {
  if (state == "camera") {
    image(video, 0, 0);
  } else if (state == "selection") {
    image(frame, 0, 0);
    displayHoveredSegment();
  } else if (state == "displayGrid") {
    background(255);
    drawComicGrid();
    displaySelectedSegments();
    displayBubbles();
  }
}

function segmentCurrentFrame() {
  showCamera = false;
  frame = video.get();
  image(frame, 0, 0);
  segmentation.detect(frame, gotResults);
}

function drawComicGrid() {
  stroke(0);
  strokeWeight(2);

  line(width / 2, 0, width / 2, height);

  line(0, height / 2, width, height / 2);
}

function displaySelectedSegments() {
  let gridSize = 2;
  let gridWidth = width / gridSize;
  let gridHeight = height / gridSize;
  let margin = 10;

  clickedSegments.forEach((segment, index) => {
    let col = index % gridSize;
    let row = Math.floor(index / gridSize);

    let x = col * gridWidth + margin;
    let y = row * gridHeight + margin;

    image(segment.img, x, y, gridWidth - 2 * margin, gridHeight - 2 * margin);

    segment.x = x;
    segment.y = y;
    segment.w = gridWidth - 2 * margin;
    segment.h = gridHeight - 2 * margin;
  });
}

function displayBubbles() {
  bubbles.forEach((bubble) => {
    let segment = clickedSegments[bubble.index];
    if (segment) {
      textSize(14);
      let bubbleWidth = max(textWidth(bubble.text) + 20, 120);
      let bubbleHeight = 60;

      if (bubble.x === undefined || bubble.y === undefined) {
        bubble.x = (width - bubbleWidth) / 2;
        bubble.y = (height - bubbleHeight) / 2;
      }

      let bubbleX = bubble.x;
      let bubbleY = bubble.y;

      fill(255);
      stroke(0);
      strokeWeight(1);
      rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 10);

      fill(0);
      noStroke();
      text(
        bubble.text,
        bubbleX + 10,
        bubbleY + 20,
        bubbleWidth - 20,
        bubbleHeight - 20
      );

      bubble.x = bubbleX;
      bubble.y = bubbleY;
    }
  });
}

function showInputBox() {
  inputBox.show();
  submitBtn.show();
}

function submitBubbleText() {
  let text = inputBox.value();

  if (text && selectedCount > 0) {
    let index = floor(random(0, selectedCount));
    bubbles.push({
      text: text,
      index: index,
    });

    inputBox.value("");
    inputBox.hide();
    submitBtn.hide();
  }
}

function gotResults(r) {
  results = r;
  state = "selection";
}

function mousePressed() {
  if (state == "selection" && selectedCount < maxSelections) {
    let clickedSegment = selectSegment(results, mouseX, mouseY);
    if (clickedSegment) {
      maskedImg = frame.get();
      maskedImg.mask(clickedSegment.mask);

      clickedSegments.push({
        img: maskedImg,
      });

      selectedCount++;
      console.log(`${selectedCount}/${maxSelections} selected`);

      if (selectedCount === maxSelections) {
        captureBtn.hide();
        state = "displayGrid";
        resetBtn.show();
        createBubbleBtn.show();
      }
    }
  } else if (state === "displayGrid") {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      let bubble = bubbles[i];
      let segment = clickedSegments[bubble.index];
      if (segment) {
        let bubbleX = bubble.x || segment.x + segment.w + 10;
        let bubbleY = bubble.y || segment.y + 10;
        let bubbleWidth = max(textWidth(bubble.text) + 20, 120);
        let bubbleHeight = 60;

        if (
          mouseX > bubbleX &&
          mouseX < bubbleX + bubbleWidth &&
          mouseY > bubbleY &&
          mouseY < bubbleY + bubbleHeight
        ) {
          draggedBubble = bubble;
          offsetX = mouseX - bubbleX;
          offsetY = mouseY - bubbleY;
          break;
        }
      }
    }
  }
}

function mouseDragged() {
  if (draggedBubble) {
    let segment = clickedSegments[draggedBubble.index];
    if (segment) {
      let bubbleX = mouseX - offsetX;
      let bubbleY = mouseY - offsetY;

      draggedBubble.x = bubbleX;
      draggedBubble.y = bubbleY;
    }
  }
}

function mouseReleased() {
  draggedBubble = null;
}

function selectSegment(segments, x, y) {
  for (let i = 0; i < segments.length; i++) {
    let mask = segments[i].mask;
    mask.loadPixels();

    let index = (y * mask.width + x) * 4;
    if (mask.pixels[index + 3] > 128) {
      return segments[i];
    }
  }
  return null;
}

function displayHoveredSegment() {
  for (let i = 0; i < results.length; i++) {
    let pixel = results[i].mask.get(mouseX, mouseY);
    if (alpha(pixel) == 255) {
      let maskedImg = frame.get();
      maskedImg.mask(results[i].mask);
      tint(0, 255, 0, 100);
      image(maskedImg, 0, 0);
      noTint();
    }
  }
}

function resetCamera() {
  showCamera = true;
  frame = null;
  maskedImg = null;
  results = null;
  clickedSegments = [];
  bubbles = [];
  selectedCount = 0;
  state = "camera";

  captureBtn.show();
  resetBtn.hide();
  createBubbleBtn.hide();
  inputBox.hide();
  submitBtn.hide();
}
