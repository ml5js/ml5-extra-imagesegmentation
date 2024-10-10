// example by Chanel Feng

let img;
let maskedImg;
let segmentation;
let results;

let segments = []; // store all the segmented parts
// let segmentationActive = true; // whether to continue segmenting
let clickedSegments = []; // store segments that have been clicked
let displayClickedSegments = false;

let video;
let frame; // Store the captured frame here
let scaleFactor = 1.0; // Default scale factor

let captureBtn;
let state = "camera"; // OR 'selection', 'drawing'
let showCamera = true;
let hideImage = false; // whether to hide the original image

let dragStartX = 0; // keep track of where we start dragging
let dragStartY = 0;

function preload() {
  segmentation = ml5.imageSegmentation({ feature_extractor_size: 256 }); // Initialize segmentation model
}

function setup() {
  createCanvas(640, 480);

  resetBtn = createButton("reset");
  resetBtn.position(0, 550);
  resetBtn.mousePressed(resetCamera);

  captureBtn = createButton("capture");
  captureBtn.position(0, 500);
  captureBtn.mousePressed(segmentCurrentFrame); // Set up the captureBtn to capture the frame when pressed

  // Set up video capture
  video = createCapture(VIDEO);
  video.size(640, 480); // Set the video size to match the canvas
  video.hide(); // Hide the default video display as we'll use image() to show it
}

function draw() {
  if (state == "camera") {
    image(video, 0, 0);
  } else if (state == "selection") {
    image(frame, 0, 0);
    for (let i = 0; i < results.length; i++) {
      let pixel = results[i].mask.get(mouseX, mouseY);
      if (alpha(pixel) == 255) {
        let maskedImg = frame.get();
        maskedImg.mask(results[i].mask);
        // tint the segmented part that the mouse hovers on
        tint(0, 127, 0, 100);
        image(maskedImg, 0, 0);
        noTint();
      }
    }
  } else if (state == "drawing") {
    background(255);
    for (let i = 0; i < clickedSegments.length; i++) {
      let segment = clickedSegments[i];
      image(segment.img, segment.x, segment.y);
    }
  }
}

function gotResults(r) {
  results = r;
  if (results) {
    state = "selection";
  }
}

function segmentCurrentFrame() {
  showCamera = false;
  // Capture the current frame from the video
  frame = video.get(); // Save the captured frame
  image(frame, 0, 0);

  // Send the captured frame to the segmentation model
  segmentation.detect(frame, gotResults);
}

function mousePressed() {
  if (state == "selection") {
    let clickedSegment = getSegmentAtMouse(results, mouseX, mouseY);
    if (clickedSegment) {
      console.log("Masking " + clickedSegment.label);
      state = "drawing";
      maskedImg = frame.get(); // Apply the mask on the captured frame, not the video
      maskedImg.mask(clickedSegment.mask);

      // Save the clicked segment
      clickedSegments.push({
        img: maskedImg,
        x: 0,
        y: 0,
        moving: true,
      });

      dragStartX = mouseX;
      dragStartY = mouseY;
    }
  }
}

function mouseDragged() {
  if (clickedSegments.length > 0) {
    let lastSegment = clickedSegments[clickedSegments.length - 1];
    // update the position if we're still "moving"
    if (lastSegment.moving == true) {
      lastSegment.x = mouseX - dragStartX;
      lastSegment.y = mouseY - dragStartY;
    }
  }
}

function mouseReleased() {
  if (clickedSegments.length > 0) {
    let lastSegment = clickedSegments[clickedSegments.length - 1];
    lastSegment.moving = false;
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    showCamera = true;
    maskedImg = true;
    frame = null;
    results = null; // Clear previous results
  }
}

function resetCamera() {
  showCamera = true;
  frame = null;
  maskedImg = null;
  results = null;
  segments = [];
  clickedSegments = [];
}

function getSegmentAtMouse(segments, x, y) {
  for (let i = 0; i < segments.length; i++) {
    let mask = segments[i].mask;
    mask.loadPixels();
    //To see if the mouse is clicked within the mask
    let index = (y * mask.width + x) * 4;
    if (mask.pixels[index + 3] > 128) {
      return segments[i];
    }
  }
  return null;
}
