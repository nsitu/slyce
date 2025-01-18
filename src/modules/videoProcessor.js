import { useAppStore } from '../stores/appStore';
import { demuxer } from './webDemuxer.js';
import { resourceUsageReport } from './resourceMonitor.js';
import { frameGenerator } from './videoDecoder.js';
import { encodeVideo } from './videoEncoder.js';
import { TileBuilder } from './tileBuilder.js';

const processVideo = async (settings) => {

    let frameNumber = 0;

    const tileBuilders = {};  // to store builder for each tileNumber 

    const {
        tilePlan,
        fileInfo,
        samplingMode,
        outputMode,
        config,
        crossSectionCount,
        crossSectionType
    } = settings

    const app = useAppStore()  // Pinia store 

    // go to the processing tab.
    app.set('currentTab', '2')
    app.set('readerIsFinished', false)

    // Start decoding by sending the stream
    const stream = demuxer.readAVPacket(0, 0, 0, -1);

    for await (const videoFrame of frameGenerator(config, stream)) {

        frameNumber++;
        app.frameNumber = frameNumber;
        app.trackFrame();

        // Determine the tile number based on the frame number
        const tileNumber = tilePlan.tiles.findIndex(
            (tile) => frameNumber >= tile.start && frameNumber <= tile.end
        );

        if (tileNumber === -1) {
            app.log(`No tile found for frame number ${frameNumber}. Skipping.`);
            videoFrame.close();
            continue;
        }

        // if tile builder doesn’t exist yet for this tile, create it
        if (!tileBuilders[tileNumber]) {
            tileBuilders[tileNumber] = new TileBuilder({
                tileNumber,
                tilePlan,
                fileInfo,
                samplingMode,
                outputMode,
                crossSectionCount,
                crossSectionType,
                frameCount: app.frameCount
            });

            // listen for when the tile is complete
            tileBuilders[tileNumber].on('complete', async (imageBitmaps) => {
                delete tileBuilders[tileNumber];

                // encode the completed tile frames into a video
                const blob = await encodeVideo(imageBitmaps, tilePlan, tileNumber, crossSectionType);
                app.addBlobURL(tileNumber, URL.createObjectURL(blob));
                app.set('currentTab', '3');
            });
        }

        // process the frame within that tile builder
        tileBuilders[tileNumber].processFrame({
            videoFrame,
            frameNumber
        });

        // Update resource usage
        // TODO: ensure that the worker reports
        // the Queue size 
        resourceUsageReport();

        // Release the VideoFrame
        videoFrame.close();

    }

}

export { processVideo }