## ml5-extra-imagesegmentation

This is an experiment in incorporating [transformers.js](https://xenova.github.io/transformers.js/) into [ml5.js](https://github.com/ml5js) for use with [p5.js](https://github.com/processing/p5.js). Done by [@gohai](https://github.com/gohai), [@chanel1130](https://github.com/chanel1130), [@Lisa-HuangZijin](https://github.com/Lisa-HuangZijin) and [@Ricci-Liu](https://github.com/Ricci-Liu) in Summer of 2024.

We're making use of the [detr-resnet-50-panoptic](https://huggingface.co/Xenova/detr-resnet-50-panoptic) image segmentation model here, which we found to provide acceptable performance in the browser (albeit not quite fast enough to run it continuously from a webcam).

### Examples

* [Basic](https://editor.p5js.org/gohai/sketches/O2GfdTOEL)
* [Webcam Collage](https://editor.p5js.org/gohai/sketches/Rj4yMiY59) by Chanel
* [Webcam Drag & Drop Storytelling](https://editor.p5js.org/gohai/sketches/kmWX0BWG7) by Lisa
* [Webcam Grid Storytelling](https://editor.p5js.org/gohai/sketches/DHXNvA4Ix) by Lisa
* [Webcam Parallax](https://editor.p5js.org/gohai/sketches/KoI-eYYkW) by Ruiqi


### Usage

In the head section of your `index.html`, add this line *after* the line that loads ml5.js:

```
<script src="https://unpkg.com/ml5-extra-imagesegmentation@0.1/src/ml5-extra-imagesegmentation.js"></script>

````

Load the image segmenter like so:

```
let segmentation;

function preload() {
  segmentation = ml5.imageSegmentation({ feature_extractor_size: 256 });
}
```

Omitting the `feature_extractor_size` option will improve the accuracy over speed.

To start a detection, pass an image or video to the `detect()` method, together with the name of a callback function.

```
segmentation.detect(img, gotResults);
```

Once the segmentation has finished, the callback function is called with an array of segments as argument.

```
function gotResults(results) {
  for (let i=0; i < resuts.length; i++) {
    result = results[i];
    console.log(result);
  }
}
```

Each result has the following properties: `label`, `score` as well as a `mask` image. The `mask` is ready to be used with p5's [mask()](https://p5js.org/reference/p5.Image/mask/#:~:text=mask()%20uses%20another%20p5,the%20mask%20will%20be%20scaled.) method.


### Acknowledgements

Many thanks to [@xenova](https://github.com/xenova) - first and foremost for transformers.js, but also for kindly providing feedback during the research for this project!
