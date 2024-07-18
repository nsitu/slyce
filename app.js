import { WebDemuxer } from "web-demuxer"
import { getMediaInfo } from './modules/getMediaInfo.mjs'

let config = {}
let frameCount = 1;
let frameNumber = 0;

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');


const demuxer = new WebDemuxer({
    wasmLoaderPath: `${window.location.href}ffmpeg.js`
});

const dropArea = document.querySelector('#drop-area');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('hover');
}

function unhighlight(e) {
    dropArea.classList.remove('hover');
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    ([...files]).forEach(processFile);
}

// Setup a VideoDecoder
const decoder = new VideoDecoder({
    output: handleDecodedFrame,
    error: e => console.error('Video decode error:', e)
});

function handleDecodedFrame(videoFrame) {
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) 

    ctx.drawImage(videoFrame, 0, 0, config.codedWidth, 1, 0, frameNumber, canvas.width, 1)
    frameNumber++;
    videoFrame.close();
}


async function processFile(file) {

    try {
        const metaData = await getMediaInfo(file)
        frameCount = metaData.FrameCount

        console.log(metaData.FrameCount)


        await demuxer.load(file);
        let streams = await demuxer.getAVStreams();

        console.log(streams)


        let info = await demuxer.getAVStream();
        console.log(info)

        console.log(info.nb_frames)
        config = await demuxer.getVideoDecoderConfig();
        console.log(config)
        if (VideoDecoder.isConfigSupported(config)) {
            console.log(`Codec ${config.codec} is supported`);
        }
        else {
            console.error(`Codec ${config.codec} is not supported`);
        }


        canvas.width = config.codedWidth;
        canvas.height = frameCount;

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
        const reader = stream.getReader();

        async function decodePackets() {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('Decoding complete');
                    return;
                }
                // https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk/type
                const chunk = new EncodedVideoChunk({
                    type: value.key ? 'key' : 'delta',
                    timestamp: value.timestamp,
                    data: value.data
                });
                decoder.decode(chunk);
                decodePackets();
            } catch (readError) {
                console.error('Error while reading packets:', readError);
            }
        }
        decodePackets();
    } catch (error) {
        console.error('Failed to process file:', error);
    }
}
