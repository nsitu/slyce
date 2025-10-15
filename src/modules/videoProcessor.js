import { useAppStore } from '../stores/appStore';
import { Input, ALL_FORMATS, BlobSource, VideoSampleSink } from 'mediabunny';
import { resourceUsageReport } from './resourceMonitor.js';
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

    // Create mediabunny input and video sample sink
    const input = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(app.file),
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    const sink = new VideoSampleSink(videoTrack);

    // Iterate through decoded video samples
    // VideoSampleSink automatically decodes frames using WebCodecs (non-blocking)
    for await (const videoSample of sink.samples()) {

        // Convert VideoSample to VideoFrame for compatibility with tileBuilder
        const videoFrame = videoSample.toVideoFrame();

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

        // Note: videoFrame.close() is called by tileBuilder after drawing
        // Close the videoSample (separate from videoFrame)
        videoSample.close();

    }

}

export { processVideo }