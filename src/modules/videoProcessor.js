import { useAppStore } from '../stores/appStore';
import { Input, ALL_FORMATS, BlobSource, VideoSampleSink } from 'mediabunny';
import { resourceUsageReport } from './resourceMonitor.js';
import { encodeVideo } from './videoEncoder.js';
import { TileBuilder } from './tileBuilder.js';
import { KTX2Assembler } from './ktx2-assembler.js';
import { KTX2WorkerPool } from './ktx2-worker-pool.js';

// Singleton worker pool for KTX2 encoding (reused across all tiles)
let ktx2WorkerPool = null;

/**
 * Cleanup function to terminate the worker pool when done
 */
const cleanupKTX2Workers = () => {
    if (ktx2WorkerPool) {
        console.log('[KTX2] Cleaning up worker pool');
        ktx2WorkerPool.terminate();
        ktx2WorkerPool = null;
    }
};

const processVideo = async (settings) => {

    let frameNumber = 0;

    const tileBuilders = {};  // to store builder for each tileNumber
    let completedTiles = 0;  // Track completed tiles 

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

    // Calculate how many frames will actually be used vs skipped
    const lastTileEnd = tilePlan.tiles[tilePlan.tiles.length - 1].end;
    const framesUsed = lastTileEnd;
    const framesSkipped = app.frameCount - framesUsed;

    // Log upfront information about the processing plan
    if (framesSkipped > 0) {
        const skippedStart = lastTileEnd + 1;
        const skippedEnd = app.frameCount;
        app.log(`Processing ${tilePlan.tiles.length} tile(s) using frames 1-${lastTileEnd}.`);
        app.log(`Frames ${skippedStart}-${skippedEnd} (${framesSkipped} frames) will be skipped.`)
    } else {
        app.log(`Processing ${tilePlan.tiles.length} tile(s) using all ${app.frameCount} frames.`);
    }

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

        try {
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
                // This frame is outside all tile ranges (remainder frames)
                // We already logged this upfront, so just skip silently
                processedFrame.close();
                videoSample.close();
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
                    frameCount: app.frameCount,
                    outputFormat: app.outputFormat  // Pass output format to TileBuilder
                });

                // listen for when the tile is complete
                tileBuilders[tileNumber].on('complete', async (payload) => {
                    delete tileBuilders[tileNumber];

                    const { images, kind } = payload;

                    if (kind === 'ktx2') {
                        // KTX2 mode: Encode RGBA frames to KTX2 using parallel workers
                        try {
                            console.log(`[KTX2] Encoding tile ${tileNumber} with ${images.length} layers (parallel)`);

                            // Create worker pool if it doesn't exist yet (shared across all tiles)
                            if (!ktx2WorkerPool) {
                                ktx2WorkerPool = new KTX2WorkerPool();
                                await ktx2WorkerPool.init();
                                console.log(`[KTX2] Worker pool created and will be reused for all tiles`);
                            }

                            // Progress callback to update status
                            const onProgress = (layersEncoded, totalLayers) => {
                                app.setStatus(`Encoding Tile ${tileNumber}`, `Encoded layer ${layersEncoded} of ${totalLayers}`);
                            };

                            // Use parallel encoding with shared worker pool
                            const ktx2Buffer = await KTX2Assembler.encodeParallelWithPool(ktx2WorkerPool, images, onProgress);
                            const blob = new Blob([ktx2Buffer], { type: 'image/ktx2' });

                            // Register KTX2 blob URL using new helper
                            app.registerBlobURL('ktx2', tileNumber, blob);

                            console.log(`[KTX2] Tile ${tileNumber} encoded: ${(blob.size / 1024).toFixed(1)}KB`);
                        } catch (error) {
                            console.error(`[KTX2] Failed to encode tile ${tileNumber}:`, error);
                            app.log(`KTX2 encoding failed for tile ${tileNumber}: ${error.message}`);
                        }
                    } else {
                        // WebM mode: Use existing video encoder
                        const blob = await encodeVideo(images, tilePlan, tileNumber, crossSectionType);
                        app.registerBlobURL('webm', tileNumber, blob);
                    }

                    // Track completion and cleanup when all tiles are done
                    completedTiles++;
                    if (completedTiles === tilePlan.tiles.length) {
                        console.log(`[VideoProcessor] All ${completedTiles} tiles completed`);
                        // Cleanup KTX2 worker pool if it was used
                        if (app.outputFormat === 'ktx2') {
                            cleanupKTX2Workers();
                        }
                    }

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

        } catch (error) {
            // If any error occurs, make sure to close the frames to prevent leaks
            console.error('[VideoProcessor] Error processing frame:', error);
            if (processedFrame && !processedFrame.closed) {
                processedFrame.close();
            }
            videoSample.close();
            throw error; // Re-throw to stop processing
        }

    }

}

export { processVideo, cleanupKTX2Workers }