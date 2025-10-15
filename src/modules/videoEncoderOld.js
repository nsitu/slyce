import { useAppStore } from '../stores/appStore';
import { Output, WebMOutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH } from 'mediabunny';

const encodeVideo = async (canvasses, tileNumber, tilePlan) => {

    const app = useAppStore()  // Pinia store 

    // 1. Create Output with WebM format
    const output = new Output({
        format: new WebMOutputFormat(),
        target: new BufferTarget(),
    });

    // 2. Create CanvasSource for video encoding
    // Use the first canvas for dimensions, create a working canvas
    const workingCanvas = new OffscreenCanvas(tilePlan.width, tilePlan.height);
    const ctx = workingCanvas.getContext('2d');

    const videoSource = new CanvasSource(workingCanvas, {
        codec: 'vp9',
        bitrate: 3e6  // 3,000,000 bits per second
    });
    output.addVideoTrack(videoSource);

    let framesCompleted = 0;


    // Given a canvas and frame index, encode the frame using mediabunny
    const encodeFrame = async (canvas, frameIndex) => {
        const frameRate = 30;  // Adjust frame rate as needed
        const frameDuration = 1 / frameRate;   // seconds

        // Draw the source canvas to our working canvas
        ctx.clearRect(0, 0, tilePlan.width, tilePlan.height);
        ctx.drawImage(canvas, 0, 0);

        // Add frame to video source
        await videoSource.add(frameIndex * frameDuration, frameDuration);

        framesCompleted++;
        app.setStatus('Encoding', `Encoded frame ${framesCompleted} of ${sequencedFrames.length} in Tile ${tileNumber}`);
    }

    // Create a single array that references each canvas twice 
    // First in natural forward order and then and again reverse
    // this results in a loopable back-and-forth effect in the final video
    const sequencedFrames = [
        ...canvasses,
        ...canvasses.slice().reverse()
    ];

    // Start the output
    await output.start();

    // Encode all frames sequentially
    for (let i = 0; i < sequencedFrames.length; i++) {
        await encodeFrame(sequencedFrames[i], i);
    }

    // Finalize the output
    await output.finalize();

    return new Blob([output.target.buffer])



}

export { encodeVideo }