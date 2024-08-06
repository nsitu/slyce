
import { setStatus } from './statusBox.mjs'
import canvasSize from 'canvas-size'


export class CanvasManager {
    constructor() {
        this.canvasCount = 60; // Number of canvasses to create
        this.canvasses = [];
        this.contexts = [];

        for (let i = 0; i < this.canvasCount; i++) {
            let canvas = new OffscreenCanvas(1, 1); // Temporary small size
            let ctx = canvas.getContext('2d');
            this.canvasses.push(canvas);
            this.contexts.push(ctx);
        }

    }

    async configure(options) {

        console.log(options)

        // we receive information about the video
        const { videoWidth, videoHeight, frameCount } = options
        setStatus('Checking canvas size limits...')
        const { height: maxCanvasHeight } = await canvasSize.maxArea()
        console.log(`Max canvas height: ${maxCanvasHeight}`)

        // capture video dimensions and duration
        this.videoWidth = videoWidth;
        this.videoHeight = videoHeight;
        this.frameCount = frameCount;

        // define canvas dimensions
        this.canvasWidth = videoWidth;
        this.canvasHeight = Math.min(frameCount, maxCanvasHeight)
        // NOTE: we are using frameCount as the height 
        // this is an intentional axis swap 

        // if we have an odd number of frames,
        // this would result in an odd height which is not allowed
        // in H264 encoding
        // we willl therefore trim 1 pixel off the height to ensure an even number of pixels
        if (this.canvasHeight % 2 !== 0) {
            this.canvasHeight--;
        }

        this.canvasses.forEach((canvas) => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });
    }

    // Draw a frame slice on a specific canvas
    drawFrame(videoFrame, frameNumber) {

        this.contexts.forEach((ctx, index) => {

            // We will sample pixels from a different y-location for each canvas  

            // Linear distribution
            // This is a simple distribution but is rather abrupt when we switch into reverse
            // NOTE: the index fraction is multiplied by the height of the video to get a sample location
            // NOTE: canvas pixels are zero indexed so we subtract 1 from the denominator and also the end result
            // Also, to prevent a negative sample location on the first iteration, we apply Max 0.
            // let sampleLocation = Math.max(((index / (this.canvasCount - 1)) * this.videoHeight) - 1, 0) 

            // Cosine distribution
            // (This creates a gentle sway back and forth)
            // TODO: audit this Math to make sure it uses the full range properly
            let normalizedIndex = (index / (this.canvasCount - 1)) * Math.PI;
            let sampleLocation = (Math.cos(normalizedIndex) + 1) / 2 * (this.videoHeight - 1);


            ctx.drawImage(videoFrame, 0, sampleLocation, this.videoWidth, 1, 0, frameNumber, this.canvasWidth, 1);
        });
        videoFrame.close();
    }

    // Clear all canvasses
    clearAll() {
        this.contexts.forEach(ctx => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        });
    }
}