import { WebDemuxer } from "web-demuxer"
import { fileHandler } from './modules/fileHandler.mjs'
import canvasSize from 'canvas-size';
import { fps } from './modules/fps.mjs'

// setup variables
let config = {}
let frameCount = 0
let frameNumber = 0
let currentFile = ''


// Pause/resume decoder with promises
let resumeDecode
let pauseDecode = new Promise(resolve => resumeDecode = resolve)


// status box
const status = document.createElement('div')
document.body.appendChild(status)

// create canvas
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
document.body.appendChild(canvas)

// Setup WebDemuxer
// NOTE: vite.config.mjs copies wasm files from node_modules to public folder
const demuxer = new WebDemuxer({
    wasmLoaderPath: `${window.location.href}public/ffmpeg.js`
});

// Setup VideoDecoder
const decoder = new VideoDecoder({
    output: (videoFrame) => {

        // we may like to draw to multiple offscreen canvasses here.
        // each canvas will hold a unique cross-section that is located 
        // at a different position along a distribution.
        // we can later animate these canvasses.

        // i need to better understand width and height here.
        // let's do some testing to see how different videos behave
        // e.g. a pixel 6a video that is portrait orientation
        // might still report as landscape, with rotation accomplished via metadata
        // this is different from other videos where 
        // the width and height are more directly swapped.




        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) 
        ctx.drawImage(videoFrame, 0, 0, config.codedWidth, 1, 0, frameNumber, canvas.width, 1)
        // console.log('videoFrame', videoFrame)
        frameNumber++;
        videoFrame.close();
        if (resumeDecode) {
            // Resolve the pauseDecode promise, allowing the next frame to be decoded
            resumeDecode();
            // Reinitialize pauseDecode and resumeDecode for the next frame
            pauseDecode = new Promise(resolve => resumeDecode = resolve);
        }
    },
    error: e => console.error('Video decode error:', e)
});


const setStatus = (message) => {
    status.innerHTML = message
}
// handle file uploads
fileHandler('#drop-area', '#file-input', processFile)


async function processFile(file) {
    // reset counter for a new file
    frameCount = 0
    frameNumber = 0
    currentFile = file.name
    try {
        setStatus(`Checking canvas size limits.`)
        const { height: maxCanvasHeight } = await canvasSize.maxArea();
        setStatus(`Loading Demuxer`)
        await demuxer.load(file);
        setStatus(`Loading Stream Info`)
        let info = await demuxer.getAVStream();
        frameCount = Number(info.nb_frames)
        console.log('getAVStream', info)
        setStatus(`Loading Video Decoder Config`)
        config = await demuxer.getVideoDecoderConfig();
        console.log(config)
        if (VideoDecoder.isConfigSupported(config)) {
            setStatus(`Codec ${config.codec} is Supported`)
            console.log(`Codec ${config.codec} is supported`);
        }
        else {
            setStatus(`Codec ${config.codec} is Not Supported`)
            console.error(`Codec ${config.codec} is not supported`);
        }

        // Set canvas dimensions to match video frameCount
        // up to the max canvas height supported by the browser

        canvas.width = config.codedWidth;
        canvas.height = Math.min(maxCanvasHeight, frameCount);

        const options = {
            codec: config.codec,
            width: config.codedWidth,
            height: config.codedHeight,
            description: config.description,
            // hardwareAcceleration: 'prefer-hardware',
            // latencyMode: 'realtime'  // 'realtime', 'quality' etc.
        }
        console.log('options', options)

        decoder.configure(options);

        // Read and decode video packets
        const stream = demuxer.readAVPacket(0, 0, 0, -1)
        // ReadableStreamDefaultReader
        const reader = stream.getReader();
        console.log('reader', reader)

        async function decodePackets() {
            try {

                if (currentFile != file.name) {
                    // if a new file is loaded, abort processing the  current file 
                    setStatus(`Aborted.`)
                    // maybe we need to close the reader and stream here
                    return;
                }

                // get  the next chunk in the stream's internal queue.
                const { done, value } = await reader.read();
                console.log(value)

                let message = `FPS: ${fps()} </br>
                    Queue size: ${decoder.decodeQueueSize}.<br/>
                    Decoding frame: ${frameNumber} of ${frameCount}<br/>`

                if (done) {
                    setStatus(`${frameCount} frames decoded. Done.`)
                    return;
                }

                // TODO: doublecheck these parameters.
                const chunkOptions = {
                    type: value.keyframe ? 'key' : 'delta',
                    timestamp: value.timestamp,
                    duration: value.duration,
                    data: value.data,
                    transfer: [value.data.buffer]
                }
                console.log('chunkOptions', chunkOptions)
                const chunk = new EncodedVideoChunk(chunkOptions);

                // Managing the Queue.
                // Sometimes decoding involves inter-frame dependencies
                // and looking ahead in the stream to decode a frame
                // (e.g., a B-frame may depend on a future I-frame).
                // On the other hand, let's not overload the decoder with a large queue.
                // A safe balance: pause the queue after 20 frames 
                // to let the decoder 'catch up'.
                // TODO: Define and manage edge cases 
                // where we need to look ahead more than 20 frames.
                // TODO: Define memory implications of lookAhead == 300 frames.
                const lookAhead = 20
                if (decoder.decodeQueueSize > lookAhead) {
                    await pauseDecode
                }
                decoder.decode(chunk)
                setStatus(message)
                // Introduce a slight delay to allow garbage collection
                // This would cap the speed to ~60fps.
                // await new Promise(requestAnimationFrame);
                decodePackets()
            } catch (readError) {
                console.error('Error while reading packets:', readError);
            }
        }
        decodePackets();
    } catch (error) {
        console.error('Failed to process file:', error);
    }
}
