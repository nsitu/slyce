import { useAppStore } from '../stores/appStore.js';
import { processFrame } from './frameProcessor.js';
import { resourceUsageReport } from './resourceMonitor.js';
import { encodeVideo } from './videoEncoder.js';

const videoDecoder = new VideoDecoder({
    output: async (videoFrame) => {

        const app = useAppStore()
        app.frameNumber++;

        // to start, find the tile the current frame belongs to
        // based on the frame number, and tile range
        let tileNumber = app.tilePlan.tiles
            .findIndex(tile => app.frameNumber >= tile.start && app.frameNumber <= tile.end);

        processFrame(videoFrame, app.frameNumber, tileNumber);

        // update ram usage stats
        resourceUsageReport();

        if (app.frameNumber === app.tilePlan.tiles[tileNumber].end) {
            // If this is the last frame in the tile, 
            // we need to encode the canvasses into a video
            // and release the canvasses back to the pool
            // or else delete the canvasses and make new ones.
            await encodeVideo(tileNumber);
        }
        // app.resume()
    },
    error: e => console.error('Video decode error:', e)
});


const decodePackets = async (reader) => {
    const app = useAppStore()
    try {
        const { done, value } = await reader.read();

        if (done) {
            await videoDecoder.flush();
            app.log('Decoder flushed, all frames processed.');
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

export { videoDecoder, decodePackets }