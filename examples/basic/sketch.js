let img;
let maskedImg;
let segmentation;

function preload() {
  img = loadImage("cats.jpg");
  // segmentation = ml5.imageSegmentation();
  // or, faster:
  segmentation = ml5.imageSegmentation({ feature_extractor_size: 256 });
}

function setup() {
  createCanvas(640, 480);
}

function draw() {
  background(255);
  if (maskedImg) {
    image(maskedImg, 0, 0);
  } else {
    image(img, 0, 0);
  }
}

function mousePressed() {
  console.log("Starting segmentation");
  segmentation.detect(img, gotResults);
}

function gotResults(r) {
  let segment = random(r);
  if (!segment) {
    console.log("Received empty result");
  }
  console.log("Masking " + segment.label);
  maskedImg = img.get();
  maskedImg.mask(segment.mask);
}
