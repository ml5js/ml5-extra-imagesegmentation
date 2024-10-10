// example by Ruiqi Liu

let img;
let maskedImg;
let segmentation;
let results;

let clickedSegments = []; // store segments that have been clicked
let video;
let frame; // Store the captured frame here
let state = "camera";
let layerNum = [];
let thisLayerPic = [];

function preload() {
  segmentation = ml5.imageSegmentation({ feature_extractor_size: 256 }); // Initialize segmentation model
}

function setup() {
  createCanvas(640, 480);

  captureBtn = createButton("capture");
  captureBtn.position(0, 500);
  captureBtn.mousePressed(segmentCurrentFrame);

  finishLayerBtn = createButton("Finish Selection");
  finishLayerBtn.position(0, 550);
  finishLayerBtn.mousePressed(finishSelection);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
}

function draw() {
  if (state == "camera") {
    image(video, 0, 0);
  } else if (state == "selection") {
    image(frame, 0, 0);
    for (let i = 0; i < results.length; i++) {
      let segment = results[i];
      if (segment.selected) {
        tint(255, 0, 0, 127);
      } else {
        let pixel = segment.mask.get(mouseX, mouseY);
        if (alpha(pixel) == 255) {
          tint(0, 127, 0, 100);
        } else {
          noTint();
        }
      }
      let maskedImg = frame.get();
      maskedImg.mask(segment.mask);
      image(maskedImg, 0, 0);
    }
    noTint();
  } else if (state == "moving") {
    background(0);
    for (let i = layerNum.length - 1; i >= 0; i--) {
      let layerPack = layerNum[i];
      for (let s = 0; s < layerPack.length; s++) {
        let layerPic = layerPack[s];
        let moveDiameter = 2 * (i + 3);
        let imgPosx = lerp(
          layerPic.x - width / moveDiameter,
          layerPic.x + width / moveDiameter,
          mouseX / width
        );
        image(layerPic.img, imgPosx, layerPic.y);
      }
    }
  }
}

function gotResults(r) {
  results = r.map((segment) => ({
    ...segment,
    selected: false,
  }));
  if (results) {
    state = "selection";
  }
}

function segmentCurrentFrame() {
  showCamera = false;
  frame = video.get(); // Save the captured frame
  image(frame, 0, 0);
  segmentation.detect(frame, gotResults);
}

function mousePressed() {
  if (state == "selection") {
    let clickedSegment = getSegmentAtMouse(results, mouseX, mouseY);
    if (clickedSegment && !clickedSegment.selected) {
      console.log("Masking " + clickedSegment.label);

      maskedImg = frame.get(); // Apply the mask on the captured frame, not the video
      maskedImg.mask(clickedSegment.mask);

      clickedSegments.push({
        img: maskedImg,
        x: 0,
        y: 0,
        moving: true,
      });

      clickedSegment.selected = true;
      thisLayerPic.push(clickedSegments[clickedSegments.length - 1]);

      //Push the new layer automatically once the user clicks on the segment part
      layerNum.push([...thisLayerPic]);
      thisLayerPic = [];
    }
  }
}

function getSegmentAtMouse(segments, x, y) {
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

function finishSelection() {
  state = "moving";
}
