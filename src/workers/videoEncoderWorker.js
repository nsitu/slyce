// tileEncoderWorker.js
import { Muxer, ArrayBufferTarget } from 'webm-muxer';

let totalFrames = 0;
let framesEncoded = 0;

let imageBitmaps = null; // <--- declare up here

// We'll expect a message that includes:
// - an array of OffscreenCanvas (the tile frames)
// - the tile's width/height
// - a config object for the encoder
self.onmessage = async (e) => {
    const { type, data } = e.data;

    if (type === 'ENCODE_TILE') {
        framesEncoded = 0;
        totalFrames = 0;

        try {


            imageBitmaps = data.imageBitmaps;
            const { tilePlan } = data;

            // 1. Create Muxer
            const muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'V_VP9',
                    width: tilePlan.width,
                    height: tilePlan.height
                },
                fastStart: 'in-memory'
            });

            // 2. Create VideoEncoder
            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => {
                    framesEncoded++;
                    self.postMessage({
                        type: 'PROGRESS',
                        data: {
                            framesEncoded,
                            totalFrames
                        }
                    });
                    muxer.addVideoChunk(chunk, meta);
                },
                error: (err) => {
                    self.postMessage({ type: 'ERROR', data: err.message });
                }
            });

            videoEncoder.configure({
                codec: 'vp09.00.10.08',
                width: tilePlan.width,
                height: tilePlan.height,
                bitrate: 3e6
            });

            // 3. Encode frames (for forward + reverse loop)
            const frames = [
                ...imageBitmaps,
                ...imageBitmaps.slice().reverse()
            ];
            totalFrames = frames.length;

            // Just an example frameRate:
            const frameRate = 30;
            const frameDuration = 1e6 / frameRate; // microseconds

            for (let i = 0; i < frames.length; i++) {
                // Convert the canvas to a VideoFrame
                const videoFrame = new VideoFrame(frames[i], {
                    timestamp: i * frameDuration,
                    duration: frameDuration
                });
                videoEncoder.encode(videoFrame, { keyFrame: i % 30 === 0 });
                videoFrame.close();
            }

            // 4. Flush the encoder
            await videoEncoder.flush();

            // 5. Finalize the muxer
            muxer.finalize();

            // 6. Create a blob from the muxer
            const blob = new Blob([muxer.target.buffer]);

            // 7. Respond back with the Blob
            // (we can’t *transfer* a Blob, but we can post it as is)
            self.postMessage({ type: 'DONE', blob });

            // Optional: close the worker once done
            // self.close();
        } catch (err) {
            // in case of errors
            self.postMessage({ type: 'ERROR', data: err.message });
        }
        finally {
            // ---- Clean up references in the worker ---- 
            // Call .close() on each ImageBitmap (optional, but recommended)
            // This explicitly frees the underlying image data
            if (imageBitmaps) {
                for (const bmp of imageBitmaps) {
                    if (typeof bmp.close === 'function') {
                        bmp.close();
                    }
                }
            }
            // Set arrays/variables to null or empty them
            // so we don't keep any lingering references
            imageBitmaps = null;
        }
    }
};
