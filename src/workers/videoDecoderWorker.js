// src/workers/videoDecoderWorker.js

// Listen for messages from the main thread
self.onmessage = async (e) => {
    const { type, data } = e.data;

    if (type === 'INIT') {
        console.log('init', data)
        // Initialize the VideoDecoder with codec information
        const { codec, codedWidth, codedHeight, description } = data;
        try {
            self.videoDecoder = new VideoDecoder({
                output: (videoFrame) => {
                    self.postMessage(
                        { type: 'VIDEO_FRAME', data: videoFrame },
                        [videoFrame]
                    );
                },
                error: (err) => {
                    self.postMessage({ type: 'ERROR', data: err.message });
                },
            });

            self.videoDecoder.configure({
                codec,
                codedWidth,
                codedHeight,
                description
            });

            // Notify main thread that decoder is initialized
            self.postMessage({ type: 'INITIALIZED' });
        } catch (error) {
            self.postMessage({ type: 'ERROR', data: error.message });
        }
    }

    if (type === 'DECODE_STREAM') {
        const { stream } = data;
        if (!stream) {
            self.postMessage({ type: 'ERROR', data: 'No stream provided for decoding.' });
            return;
        }

        try {
            const reader = stream.getReader();
            await decodePackets(reader);
            await self.videoDecoder.flush();
            self.postMessage({ type: 'DONE' });
        } catch (error) {
            self.postMessage({ type: 'ERROR', data: error.message });
        }
    }
};

const decodePackets = async (reader) => {
    try {
        const { done, value } = await reader.read();

        if (done) {
            await videoDecoder.flush();
            return;
        }
        //if (decoder.decodeQueueSize > 400) { await pauseDecode; }
        // Decode the video chunk
        let chunk = new EncodedVideoChunk({
            type: value.keyframe ? 'key' : 'delta',
            timestamp: value.timestamp,
            duration: value.duration,
            data: value.data,
            transfer: [value.data.buffer]
        })
        // console.log('Decoding chunk:', chunk);
        videoDecoder.decode(chunk);

        // Continue decoding the next packet
        await decodePackets(reader);

    } catch (readError) {
        console.error('Error while reading packets:', readError);
    }
}


// Recursive function to decode packets from the stream
// async function decodePackets(reader) {
//     while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         // value is expected to be an AVPacket
//         const { keyframe, timestamp, duration, data: packetData } = value;

//         // Create an EncodedVideoChunk
//         const chunk = new EncodedVideoChunk({
//             type: keyframe ? 'key' : 'delta',
//             timestamp: timestamp,
//             duration: duration,
//             data: packetData,
//         });

//         // Decode the chunk
//         self.videoDecoder.decode(chunk);
//     }
// }
