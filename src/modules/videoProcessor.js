import { useAppStore } from '../stores/appStore';

import { useTilePlan } from '../composables/useTilePlan';

import { demuxer } from './webDemuxer.js';
import { videoDecoder, decodePackets } from './videoDecoder.js';

import { createCanvasPool } from './canvasPool.js';



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


    try {

        // We will assume that the video is already loaded,
        // the following functions have already run in metaDataExtractor.js
        // webDemuxer.load 
        // webDemuxer.getAVStream 
        // webDemuxer.getVideoDecoderConfig

        if (VideoDecoder.isConfigSupported(app.config)) {
            app.log(`Codec ${app.config.codec} is Supported`)
            console.log(`Codec ${app.config.codec} is supported`);

            videoDecoder.configure({
                codec: app.config.codec,
                width: app.config.codedWidth,
                height: app.config.codedHeight,
                description: app.config.description,
                hardwareAcceleration: 'prefer-hardware', // default is 'prefer-hardware'
                latencyMode: 'quality'  // default is 'quality', see also: realtime.
            });

            // Read and decode video packets
            const stream = demuxer.readAVPacket(0, 0, 0, -1)
            const reader = stream.getReader()
            // pass along ReadableStreamDefaultReader for decoding
            await decodePackets(reader);

            app.log(`Decoded ${app.frameNumber} of ${app.frameCount} frames.`);

            if (app.frameNumber !== app.frameCount) {
                // app.frameNumnber is 0  for some reason on vp8
                // console.log('app.frameNumber, app.frameCount', app.frameNumber, app.frameCount)
                app.log(`Framecount mismatch.`)
            }

            app.log(`Done.`)
        }
        else {
            app.log(`Codec ${app.config.codec} is Not Supported`)
            console.error(`Codec ${app.config.codec} is not supported`);
        }

    } catch (error) {
        console.error('Failed to process file:', error);
    }
}

export { processVideo }