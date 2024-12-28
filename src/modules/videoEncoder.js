import { useAppStore } from '../stores/appStore';

// inside tileBuilder completion callback or processVideo:
const encodeVideo = async (imageBitmaps, tilePlan, tileNumber) => {


    const app = useAppStore()  // Pinia store 

    // 1. Create a new Worker
    const worker = new Worker(
        new URL('../workers/videoEncoderWorker.js', import.meta.url),
        { type: 'module' }
    );

    // 2. Return a promise that resolves when encoding is done
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
            const { type, blob, data } = e.data;
            switch (type) {
                case 'PROGRESS':
                    app.setStatus(`Encoding Tile ${tileNumber}`, `Encoded frame ${data.framesEncoded} of ${data.totalFrames}`);
                    break;
                case 'DONE':
                    resolve(blob);
                    worker.terminate(); // kill this short-lived worker
                    break;
                case 'ERROR':
                    reject(new Error(data));
                    worker.terminate();
                    break;
            }
        };

        // 3. Post the imageBitmaps to the worker, transferring them
        //    so the main thread no longer has them
        worker.postMessage({
            type: 'ENCODE_TILE',
            data: {
                imageBitmaps,       // array of imageBitmaps
                tilePlan
            }
        }, imageBitmaps); // imageBitmaps is transferable
    });
}


export { encodeVideo }