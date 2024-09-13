import { WebDemuxer } from "web-demuxer"
import { fileHandler } from './modules/fileHandler.mjs'
import { CanvasManager } from './modules/canvasManager.mjs';
import { setStatus } from './modules/statusBox.mjs'
import { logMessage } from './modules/activityLog.mjs'
import { showFileInfo } from './modules/fileInfo.mjs'
import { fps } from './modules/fps.mjs'
import { Muxer, ArrayBufferTarget } from 'webm-muxer';
import 'material-symbols';

// TODO: account for videos that are taller than they are wide 
// while most portrait videos are 1920x1080 with a rotation metadata
// sometimes you do get 1080x1920 videos e.g. when processed Adobe Premiere by SVP Smooth Video Project

// TODO: allow for manual control of rotation.

// TODO: allow for the use of a webcam as a source

// TODO: split outputs into a series of square videos instead of a single long video.


// setup variables
let config = {}
let frameCount = 0
let frameNumber = 0
let readerIsFinished = false
let currentFile = ''

// Pause/resume decoder with promises
let resumeDecode
let pauseDecode = new Promise(resolve => resumeDecode = resolve)


// Setup WebDemuxer
// NOTE: vite.config.mjs copies wasm files from node_modules to public folder
const demuxer = new WebDemuxer({
    wasmLoaderPath: `${window.location.href}public/ffmpeg.js`
});

const canvasManager = new CanvasManager();  // Create a new instance of CanvasManager

// Setup VideoDecoder
const decoder = new VideoDecoder({
    output: (videoFrame) => {



        canvasManager.drawFrame(videoFrame, frameNumber);
        // the canvasManager will close the videoFrame
        frameNumber++;

        let heapStatus = '';

        if (performance.memory) {
            const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
            heapStatus = `Used: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB <BR/>
                Total: ${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB <BR/>
                Limit: ${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        }


        setStatus(`
            Stream: ${readerIsFinished ? 'finished' : 'reading'}</br>
        FPS: ${fps()} </br>
        Queue size: ${decoder.decodeQueueSize}.<br/>
        Decoded frame: ${frameNumber} of ${frameCount}<br/> ${heapStatus}
        `)



        if (resumeDecode) {
            // Resolve the pauseDecode promise, allowing the next frame to be decoded
            resumeDecode();
            // Reinitialize pauseDecode and resumeDecode for the next frame
            pauseDecode = new Promise(resolve => resumeDecode = resolve);
        }
    },
    error: e => console.error('Video decode error:', e)
});


// handle file uploads and pass along the file to the processFile function
fileHandler(processFile)


async function processFile(file) {
    // reset counter for a new file
    frameCount = 0
    frameNumber = 0
    readerIsFinished = false
    if (currentFile != '' && currentFile != file.name) {
        // if a new file is loaded, reset the canvas manager
        canvasManager.clearAll()
    }
    currentFile = file.name
    try {

        logMessage(`Loading Demuxer`)
        await demuxer.load(file);
        logMessage(`Loading Stream Info`)
        let info = await demuxer.getAVStream();
        frameCount = Number(info.nb_frames)
        logMessage('Displaying File Metadata')
        showFileInfo({ ...info, name: file.name })
        console.log('getAVStream', info)
        logMessage(`Loading Video Decoder Config`)
        config = await demuxer.getVideoDecoderConfig();
        console.log(config)
        if (VideoDecoder.isConfigSupported(config)) {
            logMessage(`Codec ${config.codec} is Supported`)
            console.log(`Codec ${config.codec} is supported`);
        }
        else {
            logMessage(`Codec ${config.codec} is Not Supported`)
            console.error(`Codec ${config.codec} is not supported`);
        }
        // pass along details about the video to the canvas manager
        await canvasManager.configure({
            videoWidth: config.codedWidth,
            videoHeight: config.codedHeight,
            frameCount: frameCount
        });


        decoder.configure({
            codec: config.codec,
            width: config.codedWidth,
            height: config.codedHeight,
            description: config.description,
            hardwareAcceleration: 'prefer-hardware', // default is 'prefer-hardware'
            latencyMode: 'quality'  // default is 'quality', see also: realtime.
        });

        // Read and decode video packets
        const stream = demuxer.readAVPacket(0, 0, 0, -1)
        const reader = stream.getReader()
        // pass along ReadableStreamDefaultReader for decoding
        await decodePackets(reader);

        logMessage(`Decoded ${frameNumber} of ${frameCount} frames.`);

        if (frameNumber !== frameCount) {
            logMessage(`Framecount mismatch.`)
        }
        encodeVideo();


    } catch (error) {
        console.error('Failed to process file:', error);
    }
}

async function decodePackets(reader) {
    try {
        const { done, value } = await reader.read();

        if (done) {
            await decoder.flush();
            logMessage('Decoder flushed, all frames processed.');
            return;
        }
        //if (decoder.decodeQueueSize > 400) { await pauseDecode; }
        // Decode the video chunk
        decoder.decode(new EncodedVideoChunk({
            type: value.keyframe ? 'key' : 'delta',
            timestamp: value.timestamp,
            duration: value.duration,
            data: value.data,
            transfer: [value.data.buffer]
        }));

        // Continue decoding the next packet
        await decodePackets(reader);

    } catch (readError) {
        console.error('Error while reading packets:', readError);
    }
}

const encodeVideo = async () => {



    let muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
            codec: 'V_VP9',
            width: canvasManager.canvasWidth,
            height: canvasManager.canvasHeight
        },
        fastStart: 'in-memory'
    });

    let framesCompleted = 0;
    let videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
            framesCompleted++
            setStatus(`Encoded frame ${framesCompleted} of ${sequencedFrames.length}`)
            muxer.addVideoChunk(chunk, meta)
        },
        error: e => console.error(e)
    });
    videoEncoder.configure({
        codec: 'vp09.00.10.08',
        width: canvasManager.canvasWidth,
        height: canvasManager.canvasHeight,
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
        ...canvasManager.canvasses,
        ...canvasManager.canvasses.slice().reverse()
    ];

    sequencedFrames.forEach((canvas, frameIndex) => encodeFrame(canvas, frameIndex))
    await videoEncoder.flush();
    muxer.finalize();


    logMessage(`Downloading video...`)

    let buffer = muxer.target.buffer;
    downloadBlob(new Blob([buffer], { type: 'video/webm' }));
    logMessage(`Done.`)

}


const downloadBlob = (blob) => {
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'output.webm';
    document.body.appendChild(a);
    a.click();

    // window.URL.revokeObjectURL(url);

    // Create a video element and add it to the page
    let videoContainer = document.getElementById('video-container'); // Ensure there's a container with this ID in your HTML
    if (!videoContainer) {
        videoContainer = document.createElement('div');
        videoContainer.id = 'video-container';
        document.body.appendChild(videoContainer);
    }

    let videoElement = document.createElement('video');
    videoElement.style.maxWidth = '100%'
    videoElement.src = url;
    videoElement.controls = true;
    videoElement.loop = true;
    videoContainer.appendChild(videoElement);

    videoElement.play(); // Start playing the video
};