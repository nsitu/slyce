import MediaInfoFactory from 'mediainfo.js'
import { AVC, HEVC, VP, AV } from "media-codecs";


/*
We use MediaInfo.js to get metadata about the video file.
We use media-codecs to convert metadata to a WebCodecs-compatible codec string.

MediaInfo   media-codecs  Info/
CodecID		Module        Notes
-----------------------------------------------------
vp08		VP            WebM / Google
vp09		VP            WebM / Google
hvc1		HEVC          High Efficiency Video Coding / H.265
avc1		AVC           Advanced Video Coding / H.264
av01		AV            Alliance for Open Media / AOMedia Video 1
*/

function mediainfoToCodecString(metaData) {
    switch (metaData.CodecID) {
        case 'avc1':
            // AVC is also known as H.264
            return AVC.getCodec({
                profile: metaData.Format_Profile,
                level: metaData.Format_Level
            });
        case 'hvc1':
            // HEVC is also known as H.265
            return HEVC.getCodec({
                profile: metaData.Format_Profile,
                level: metaData.Format_Level,
                tier: metaData.Format_Tier,
                /* NOTE: the following params are not yet developed
                see also: https://github.com/dmnsgn/media-codecs */
                /* compatibility, */
                /* constraint = "b0" */
            });
        case 'vp08':
            return VP.getCodec({
                name: "VP8",
                profile: metaData.Format_Profile,
                level: metaData.Format_Level,
                bitDepth: metaData.BitDepth
            })
        case 'vp09':
            return VP.getCodec({
                name: "VP9",
                profile: metaData.Format_Profile,
                level: metaData.Format_Level,
                bitDepth: metaData.BitDepth
            })
        // NOTE: mediainfo reports vp09 in lowercase
        case 'av01':
            return AV.getCodec({
                name: "AV1",
                profile: metaData.Format_Profile,
                level: metaData.Format_Level,
                tier: metaData.Format_Profile,
                bitDepth: metaData.BitDepth
            });
        default:
            throw new Error(`Unsupported video format: ${metaData.Format}`);
    }
}



// Function to handle file analysis
async function analyzeVideoFile(file) {
    let mediainfo = await MediaInfoFactory();
    console.log('MediaInfo.js ready:', mediainfo);

    const getSize = () => file.size;
    const readChunk = (chunkSize, offset) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target.error) {
                    reject(event.target.error);
                }
                resolve(new Uint8Array(event.target.result));
            };
            reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
        });

    try {
        // Analyze the file with MediaInfo.js
        let result = await mediainfo.analyzeData(getSize, readChunk)
        const metaData = result?.media?.track.find(t => t['@type'] === 'Video')
        console.log('MediaInfo data:', metaData);
        return metaData
    }
    catch (error) {
        console.error('Error analyzing file with MediaInfo.js:', error);
    }
}

const dropArea = document.body;

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




// Setup a  VideoDecoder
const videoDecoder = new VideoDecoder({
    output: handleDecodedFrame,
    error: e => console.error('Video decode error:', e)
});

function handleDecodedFrame(videoFrame) {
    // Process the video frame
    console.log('Decoded frame:', videoFrame);
    // Here, you can draw the frame to an OffscreenCanvas, manipulate it, or analyze it 
    videoFrame.close();
}


async function processFile(file) {
    const metaData = await analyzeVideoFile(file);

    // Check if metaData contains necessary video track information
    if (metaData) {
        // Assuming you have a `file` object from the file input
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function () {
            const buffer = fileReader.result;
            const data = new Uint8Array(buffer);

            // Configure the decoder based on the video codec specifics extracted
            videoDecoder.configure({
                codec: metaData.CodecID, // Using the dynamically obtained codec ID
                hardwareAcceleration: 'prefer-hardware',  // Optional: prefer using hardware decoding
                width: metaData.Width,   // Using the actual width from the video metadata
                height: metaData.Height, // Using the actual height from the video metadata
                framerate: metaData.FrameRate  // Using the actual frame rate from the video metadata
            });

            // Create a Chunk to decode
            const chunk = new EncodedVideoChunk({
                type: 'key',  // Assume it's a key frame for simplicity
                timestamp: 0,  // You might need to handle proper timing for each frame
                data: data
            });

            // Decode the chunk
            videoDecoder.decode(chunk);

            // When all frames are processed, or when you want to flush the decoder
            videoDecoder.flush().then(() => {
                console.log('Finished decoding all frames');
                videoDecoder.close();
            });
        };
    } else {
        console.error('No video metadata available to configure the decoder.');
    }
}



// The version below works great but does not account for chunking

// function processFile(file) {
//     console.log(file)
//     const reader = new FileReader();
//     reader.onload = function (e) {

//         const arrayBuffer = e.target.result
//         arrayBuffer.fileStart = 0
//         const mp4boxFile = MP4Box.createFile()

//         mp4boxFile.onError = function (e) {
//             console.error('Error while parsing the file:', e)
//         }

//         mp4boxFile.onReady = function (info) {
//             const videoTrack = info.tracks.find(track => track.type === 'video');
//             if (videoTrack) {
//                 // VP8 uniquely has a shorter codec string.
//                 // https://www.w3.org/TR/webcodecs-codec-registry/#video-codec-registry
//                 if (videoTrack.codec.startsWith('vp08')) videoTrack.codec = 'vp8';
//                 console.log('Extracted codec string:', videoTrack.codec);

//                 // Now you can configure your VideoDecoder with this codec string
//                 videoDecoder.configure({
//                     codec: videoTrack.codec,
//                     width: videoTrack.width,
//                     height: videoTrack.height
//                 });

//                 // You can start decoding process here
//             }
//         };
//         mp4boxFile.appendBuffer(arrayBuffer);
//         mp4boxFile.flush();
//     };
//     reader.readAsArrayBuffer(file);
// }
