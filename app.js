import { WebDemuxer } from "web-demuxer"
import { fileHandler } from './modules/fileHandler.mjs'
import { getMediaInfo } from './modules/getMediaInfo.mjs'

// setup variables
let config = {}
let frameCount = 1
let frameNumber = 0
let readNumber = 0

// status box
const status = document.createElement('div')
document.body.appendChild(status)

// create canvas
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
document.body.appendChild(canvas)


// setup WebDemuxer
const demuxer = new WebDemuxer({
    wasmLoaderPath: `${window.location.href}ffmpeg.js`
});

// Setup VideoDecoder
const decoder = new VideoDecoder({
    output: (videoFrame) => {
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) 
        ctx.drawImage(videoFrame, 0, 0, config.codedWidth, 1, 0, frameNumber, canvas.width, 1)
        frameNumber++;

        videoFrame.close();
    },
    error: e => console.error('Video decode error:', e)
});


const setStatus = (message) => {
    status.innerText = message
}
// handle file uploads
fileHandler('#drop-area', '#file-input', processFile)


async function processFile(file) {
    try {
        setStatus(`Loading MetaData: ${file.name}`)
        const metaData = await getMediaInfo(file)
        setStatus(`Loading Demuxer`)
        frameCount = metaData.FrameCount
        await demuxer.load(file);
        setStatus(`Loading Stream Information`)
        let streams = await demuxer.getAVStreams();
        console.log('getAVStreams', streams)
        setStatus(`Loading Stream`)
        let info = await demuxer.getAVStream();
        // console.log('info', info)
        // console.log('info.nb_frames', info.nb_frames)
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

        // Set canvas dimensions to match video
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
        // ReadableStreamDefaultReader
        const reader = stream.getReader();
        console.log('reader', reader)

        async function decodePackets() {
            try {
                // get  the next chunk in the stream's internal queue.
                const { done, value } = await reader.read();

                let message = `Reading Packet: ${readNumber}.\n
                    Queue size: ${decoder.decodeQueueSize}.\n
                    Encoding frame: ${frameNumber}\n 
                    Total frames: ${frameCount}.\n`
                readNumber++;

                if (done) {
                    setStatus(message + '\nDecoding complete')
                    return;
                }
                const chunk = new EncodedVideoChunk({
                    type: value.key ? 'key' : 'delta',
                    timestamp: value.timestamp,
                    data: value.data
                });
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
