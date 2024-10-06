// NOTE: this worker is currently not being used.  
// you may like to revist the use of workers in the app. 
let canvas, ctx;

self.onmessage = function (event) {
    const data = event.data;

    switch (data.type) {
        case 'configure':
            canvas = new OffscreenCanvas(data.videoWidth, data.videoHeight);
            ctx = canvas.getContext('2d');
            break;

        case 'drawFrame':
            // Calculate the sample location for each canvas based on its index
            let sampleLocation = Math.max(((data.index / (data.canvasCount - 1)) * data.videoHeight) - 1, 0);
            ctx.drawImage(data.videoFrame, 0, sampleLocation, data.videoWidth, 1, 0, data.frameNumber, data.videoWidth, 1);

            // Optionally, after drawing, post back some results or signals
            self.postMessage({ status: 'completed', frameNumber: data.frameNumber });
            break;

        case 'sendImageData':
            // Optionally convert to ImageBitmap if needed for manipulation or directly send the canvas
            self.postMessage({ type: 'imageData', canvas: canvas }, [canvas]);  // Transfer canvas back to main thread
            break;

        case 'clear':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            break;
    }
};
