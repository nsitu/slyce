import { useAppStore } from '../stores/appStore';

export async function* frameGenerator(config, stream) {

    // We need a small queue to buffer frames from the worker:
    const frameQueue = [];
    let done = false;


    const app = useAppStore()  // Pinia store

    // Import the worker script using Vite's worker import syntax
    // Vite handles bundling and worker script URLs
    const VideoDecoderWorker = new Worker(
        new URL('../workers/videoDecoderWorker.js', import.meta.url),
        { type: 'module' }
    );


    // Initialize worker event listeners
    VideoDecoderWorker.onmessage = async (e) => {
        const { type, data } = e.data;

        switch (type) {
            case 'INITIALIZED':
                app.log('VideoDecoderWorker initialized.');

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

                const videoFrame = data; // The VideoFrame is in data

                if (videoFrame instanceof VideoFrame) {

                    frameQueue.push(videoFrame);


                } else {
                    app.log(`Received unexpected data from worker: ${videoFrame}`);
                }
                break;

            case 'DONE':

                done = true;
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
                codec: config.codec,
                codedWidth: config.codedWidth,
                codedHeight: config.codedHeight,
                description: config.description,
            }
        });
    } catch (error) {
        app.log(`Failed to initialize VideoDecoderWorker: ${error.message}`);
        console.error(`Failed to initialize VideoDecoderWorker: ${error.message}`);
    }

    // Now yield frames as they arrive
    while (!done || frameQueue.length > 0) {
        // Wait if queue is empty but not done
        if (frameQueue.length === 0) {
            await new Promise((resolve) => setTimeout(resolve, 5));
            continue;
        }
        yield frameQueue.shift();
    }

}


// export { decodeVideo }