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
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) 
        // ctx.drawImage(videoFrame, 0, 0, config.codedWidth, 1, 0, frameNumber, canvas.width, 1)
        // console.log('videoFrame', videoFrame)
        frameNumber++;
        videoFrame.close();
        if (resumeDecode) {
            resumeDecode()
            pauseDecode = new Promise(resolve => resumeDecode = resolve)
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

        decoder.configure({
            codec: config.codec,
            width: config.codedWidth,
            height: config.codedHeight,
            description: config.description,
            // hardwareAcceleration: 'prefer-hardware',
            // latencyMode: 'realtime'  // 'realtime', 'quality' etc.
        });

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

                let message = `FPS: ${fps()} </br>
                    Queue size: ${decoder.decodeQueueSize}.<br/>
                    Decoding frame: ${frameNumber} of ${frameCount}<br/>`

                if (done) {
                    setStatus(`${frameCount} frames decoded. Done.`)
                    return;
                }
                const chunk = new EncodedVideoChunk({
                    type: value.key ? 'key' : 'delta',
                    timestamp: value.timestamp,
                    data: value.data
                });
                if (decoder.decodeQueueSize > 1) {
                    await pauseDecode
                }
                decoder.decode(chunk)
                setStatus(message)
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
