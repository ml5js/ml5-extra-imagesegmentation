class ImageSegmentation {
  constructor(options = {}) {
    this.options = options;
    this.modelName = "Xenova/detr-resnet-50-panoptic";
    this.queue = [];
    this.timerId = null;
    this.loadModel();
  }

  async loadModel() {
    if (ml5.transformers === undefined) {
      ml5.transformers = import(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers"
      );
    }
    ml5.transformers = await ml5.transformers;
    console.log(
      "Loaded transformers.js version " + ml5.transformers.env.version
    );

    ml5.transformerModels = ml5.transformerModels || {};
    if (this.modelName in ml5.transformerModels === false) {
      ml5.transformerModels[this.modelName] = ml5.transformers.pipeline(
        "image-segmentation",
        this.modelName,
        {
          device: "webgpu",
          dtype: "fp16",  // fp16 appears faster than fp32
        }
      );
    }
    ml5.transformerModels[this.modelName] = await ml5.transformerModels[
      this.modelName
    ];
    this.model = ml5.transformerModels[this.modelName];
    console.log("Loaded " + this.modelName);
  }

  async ready() {
    await ml5.transformers;
    await ml5.transformerModels[this.modelName];
  }

  async detect(media, callback) {
    // don't proceed before library and model are available
    await this.ready();

    // this uses a queue, since transformers.js can only
    // deal with a single invocation of the model at a time
    const job = {
      media: media,
      callback: callback,
    };

    // detect returns a promise, which will be resolved
    // when the detection is done (for users who prefer
    // to use await, rather than the callback)
    const promise = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });

    // add the job to the queue
    this.queue.push(job);

    // if the queue isn't running, start it
    if (!this.timerId) {
      this.timerId = setTimeout(() => {
        this.work();
      }, 0);
    }

    return promise;
  }

  to_image(mask) {
    if (window?.p5) {
      const img = new p5.Image(mask.width, mask.height);
      img.loadPixels();
      for (let i = 0; i < mask.width * mask.height; i++) {
        img.pixels[i * 4 + 3] = mask.data[i];
      }
      img.updatePixels();
      return img;
    } else {
      return mask;
    }
  }
  
  async work() {
    // get the oldest job
    const job = this.queue.shift();

    // handle p5 images
    if (job.media.loadPixels) {
      job.media.loadPixels();
      job.media = job.media.canvas.toDataURL();
    }

    // honor any feature_extractor.size passed as option to the constructor
    if (this.options.feature_extractor_size) {
      this.model.processor.feature_extractor.size = {
        shortest_edge: this.options.feature_extractor_size,
      };
    }
    
    try {

      const modelResults = await this.model(job.media);
      
      const ourResults = [];
      for (let modelResult of modelResults) {
        const ourResult = {};
        ourResult.mask = this.to_image(modelResult.mask);
        ourResult.label = modelResult.label;
        ourResult.score = modelResult.score;
        ourResults.push(ourResult);
      }

      // invoke the callback function passed to detect()
      if (typeof job.callback == 'function') {
        job.callback(ourResults);
      }
      // and resolve the promise detect() returned
      job.resolve(ourResults);

    } catch (e) {

      // something went wrong
      if (typeof job.callback == 'function') {
        job.callback([], e.message);
      }
      job.reject(e.message);

    }

    // if there are outstanding jobs, schedule another
    // invocation of work()
    if (this.queue.length > 0) {
      this.timerId = setTimeout(() => {
        this.work();
      }, 0);
    } else {
      this.timerId = null;
    }
  }
}


// There should be better ways of extending the ml5 object
if (typeof ml5 == 'undefined') {
  console.warn("If you are using ml5.js, make sure to include ml5-extra-imagesegmentation.js after ml5.js in your HTML file.");
  ml5 = {};
}
ml5.imageSegmentation = function (options = {}) {
  return new ImageSegmentation(options);
};
