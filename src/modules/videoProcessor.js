import { useAppStore } from '../stores/appStore';
import { useTilePlan } from '../composables/useTilePlan';
import { demuxer } from './webDemuxer.js';

import { processFrame } from './frameProcessor.js';
import { resourceUsageReport } from './resourceMonitor.js';
import { encodeVideo } from './videoEncoder.js';
import { createCanvasPool } from './canvasPool.js';

// Import the worker script using Vite's worker import syntax
// Vite handles bundling and worker script URLs
const VideoDecoderWorker = new Worker(
    new URL('../workers/videoDecoderWorker.js', import.meta.url),
    { type: 'module' }
);

/**Video Processing

CANVAS POOL
During construction each tile needs (app.crossSectionCount) # of canvasses
Therefore let's establish a pool of canvasses to be used for building tiles
Canvas dimensions are defined in tilePlan 
Populate the pool with a reasonable number of canvasses.
    - e.g. based on available RAM and Tile dimensions.
    - as a baseline, make enough canvasses for 3 tiles.
        - i.e. 3 * app.crossSectionCount
Auto-Allocate canvasses for currentTile and the nextTile
Store In-use canvasses in app.canvasses[tileNumber][canvasNumber]
On tile completion:
 -release canvasses back to the pool.
    canvasPool.releaseCanvas(app.canvasses[tileNumber][canvasNumber]);
 -remove references to tile canvasses from app.canvasses
    remove(app.canvasses[tileNumber])

--

Given a decoded frame, and frame number
Look up the tile to which it belongs.
-Use the frame number range in the tilePlan
-check whether the strategy is "planes" or "waves
-locate the position of the sample
-for "planes" a spatial easing function applies
-for "waves" a temporal wave function applies
    -each cross section has a unique offset
-for each of app.crossSectionCount sample pixels
-for each sample, write pixels to destination canvas
    -with rotate transform if applicable
        -i.e. if sampleMode != outputMode
    -with scale transform if applicable
        -i.e. if optimizing for quantity 
-if the frame is the last frame in the tile
    -encode the cross ections in the tile
        as frames in a new video
    -release the canvasses back to the pool


 */


// We should probably only deal with a few tiles at a time 
// once a tile is complete, (e.g. encoding is finished)
// we can re-use the canvasses for the next tile.

const processVideo = async () => {

    const app = useAppStore()  // Pinia store

    // when processing, we will bake the current tilePlan
    // so that it doesnt mutate unexpectedly during processing
    const { tilePlan } = useTilePlan()
    app.set('tilePlan', tilePlan.value) // I'm not sure if this is actually preventing mutations
    console.log('tilePlan', app.tilePlan)

    // Initialize a canvas pool with adequate canvasses
    // Note: the pool becomes most useful as a way to conserve memory
    // when we have more than 3 tiles 
    let basePoolSize = app.crossSectionCount * 3;


    let maxPoolSize = app.crossSectionCount * app.tilePlan.tiles.length;
    const poolSize = Math.min(basePoolSize, maxPoolSize);
    app.set('canvasPool', createCanvasPool(poolSize, app.tilePlan.width, app.tilePlan.height));

    // go to the processing tab.
    app.set('currentTab', '2')
    // reset frame counter for a new file
    app.set('frameNumber', 0)
    app.set('readerIsFinished', false)


    // Initialize worker event listeners
    VideoDecoderWorker.onmessage = async (e) => {
        const { type, data } = e.data;

        switch (type) {
            case 'INITIALIZED':
                app.log('VideoDecoderWorker initialized.');
                // Start decoding by sending the stream
                const stream = demuxer.readAVPacket(0, 0, 0, -1);

                if (!stream) {
                    app.log('ReadableStream is not available.');
                    VideoDecoderWorker.postMessage({ type: 'ERROR', data: 'ReadableStream is not available.' });
                    return;
                }

                VideoDecoderWorker.postMessage({
                    type: 'DECODE_STREAM',
                    data: { stream }
                }, [stream]);
                break;

            case 'VIDEO_FRAME':
                // Receive the transferred VideoFrame 
                const videoFrame = data; // The VideoFrame is in data

                if (videoFrame instanceof VideoFrame) {
                    app.frameNumber++;

                    // Determine the tile number based on the frame number
                    const tileNumber = app.tilePlan.tiles.findIndex(
                        (tile) => app.frameNumber >= tile.start && app.frameNumber <= tile.end
                    );

                    if (tileNumber === -1) {
                        app.log(`No tile found for frame number ${app.frameNumber}. Skipping.`);
                        videoFrame.close();
                        return;
                    }

                    // Process the frame
                    processFrame(videoFrame, app.frameNumber, tileNumber);

                    // Update resource usage
                    // TODO: ensure that the worker reports
                    // the Queue size 
                    resourceUsageReport();

                    // Check if this is the last frame of the tile
                    if (app.frameNumber === app.tilePlan.tiles[tileNumber].end) {
                        await encodeVideo(tileNumber);
                    }

                    // Release the VideoFrame
                    videoFrame.close();
                } else {
                    app.log(`Received unexpected data from worker: ${videoFrame}`);
                }
                break;

            case 'DONE':
                app.log('Video processing completed.');
                // Terminate the worker if no longer needed
                VideoDecoderWorker.terminate();
                break;

            case 'ERROR':
                app.log(`Error in VideoDecoderWorker: ${data}`);
                console.error(`Error in VideoDecoderWorker: ${data}`);
                // Terminate the worker on error
                VideoDecoderWorker.terminate();
                break;

            default:
                app.log(`Unknown message type from worker: ${type}`);
        }
    };

    // Initialize the worker with codec information
    try {
        VideoDecoderWorker.postMessage({
            type: 'INIT',
            data: {
                codec: app.config.codec,
                codedWidth: app.config.codedWidth,
                codedHeight: app.config.codedHeight,
                description: app.config.description,
            }
        });
    } catch (error) {
        app.log(`Failed to initialize VideoDecoderWorker: ${error.message}`);
        console.error(`Failed to initialize VideoDecoderWorker: ${error.message}`);
    }

}

export { processVideo }