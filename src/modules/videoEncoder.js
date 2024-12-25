import { useAppStore } from '../stores/appStore';
import { Muxer, ArrayBufferTarget } from 'webm-muxer';

const encodeVideo = async (tileNumber) => {

    const app = useAppStore()  // Pinia store 

    let muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
            codec: 'V_VP9',
            width: app.tilePlan.width,
            height: app.tilePlan.height
        },
        fastStart: 'in-memory'
    });

    let framesCompleted = 0;
    let videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
            framesCompleted++
            app.setStatus('Encoding', `Encoded frame ${framesCompleted} of ${sequencedFrames.length} in Tile ${tileNumber}`)
            muxer.addVideoChunk(chunk, meta)
        },
        error: e => console.error(e)
    });
    videoEncoder.configure({
        codec: 'vp09.00.10.08',
        width: app.tilePlan.width,
        height: app.tilePlan.height,
        bitrate: 3e6  // 3,000,000 bits per second
    });


    // Given a canvas and frame index, encode the frame using the videoEncoder
    const encodeFrame = (canvas, frameIndex) => {
        const frameRate = 30;  // Adjust frame rate as needed
        const frameDuration = 1e6 / frameRate;   // 1,000,000 microseconds per second / 30 frames per second. 
        const frame = new VideoFrame(canvas, {
            timestamp: frameIndex * frameDuration,
            duration: frameDuration
        });
        // Keyframe every 30 frames  
        videoEncoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
        frame.close()
    }

    // Create a single array that references each canvas twice 
    // First in natural forward order and then and again reverse
    // this results in a loopable back-and-forth effect in the final video
    const sequencedFrames = [
        ...app.canvasses[tileNumber],
        ...app.canvasses[tileNumber].slice().reverse()
    ];

    sequencedFrames.forEach((canvas, frameIndex) => encodeFrame(canvas, frameIndex))
    await videoEncoder.flush();
    muxer.finalize();


    app.log(`Creating Blob...`)
    let blob = new Blob([muxer.target.buffer])

    app.createBlob(tileNumber, {
        blob,
        url: URL.createObjectURL(blob)
    })

    app.set('currentTab', '3')


}

export { encodeVideo }