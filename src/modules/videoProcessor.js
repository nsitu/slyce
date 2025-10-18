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

        // Upfront downsampling: preprocess frame if strategy is 'upfront' and scaling is needed
        let processedFrame = videoFrame;
        let effectiveFileInfo = fileInfo;

        if (tilePlan.isScaled && app.downsampleStrategy === 'upfront') {
            // Calculate scale factor (maintains aspect ratio)
            const scaleFactor = tilePlan.scaleTo / tilePlan.scaleFrom;
            const scaledWidth = Math.floor(fileInfo.width * scaleFactor);
            const scaledHeight = Math.floor(fileInfo.height * scaleFactor);

            // Create temporary canvas for downsampling
            const tempCanvas = new OffscreenCanvas(scaledWidth, scaledHeight);
            const tempCtx = tempCanvas.getContext('2d');

            // Set image smoothing quality for better results
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';

            // Downsample entire frame
            tempCtx.drawImage(videoFrame,
                0, 0, fileInfo.width, fileInfo.height,    // Source: full frame
                0, 0, scaledWidth, scaledHeight           // Dest: scaled frame
            );

            // Create new VideoFrame from downsampled canvas
            processedFrame = new VideoFrame(tempCanvas, {
                timestamp: videoFrame.timestamp
            });

            // Update fileInfo to reflect scaled dimensions
            effectiveFileInfo = {
                ...fileInfo,
                width: scaledWidth,
                height: scaledHeight
            };

            // Clean up original frame
            videoFrame.close();
        }

        frameNumber++;
        app.frameNumber = frameNumber;
        app.trackFrame();

        // Determine the tile number based on the frame number
        const tileNumber = tilePlan.tiles.findIndex(
            (tile) => frameNumber >= tile.start && frameNumber <= tile.end
        );

        if (tileNumber === -1) {
            app.log(`No tile found for frame number ${frameNumber}. Skipping.`);
            processedFrame.close();
            continue;
        }

        // if tile builder doesn't exist yet for this tile, create it
        if (!tileBuilders[tileNumber]) {
            tileBuilders[tileNumber] = new TileBuilder({
                tileNumber,
                tilePlan,
                fileInfo: effectiveFileInfo,  // Use effectiveFileInfo instead of fileInfo
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

        // process the frame within that tile builder (now uses scaled frame if upfront strategy)
        tileBuilders[tileNumber].processFrame({
            videoFrame: processedFrame,
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