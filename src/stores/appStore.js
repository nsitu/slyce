import { defineStore } from 'pinia';

// This store keeps track of the global status of the application
export const useAppStore = defineStore('appStore', {
    state: () => ({
        config: {},
        frameCount: 0,
        framesToSample: 0, // User-adjustable limit; defaults to frameCount
        frameNumber: 0,
        crossSectionCount: 30,
        crossSectionType: 'waves', // planes, waves
        samplingMode: 'rows',       // rows, columns
        outputMode: 'rows',         // rows, columns
        tileMode: 'tile',           // tile, full
        tileProportion: 'square',       // square, landscape, portrait
        prioritize: 'powersOfTwo',         // quantity, quality, powersOfTwo
        potResolution: 512,             // 128, 256, 512, 1024
        downsampleStrategy: 'upfront', // perSample, upfront
        readerIsFinished: false,
        fileInfo: null,
        samplePixelCount: 0, /** equals width or height depending on samplingMode */
        messages: [],
        status: {},

        fpsNow: 0,          // current FPS measurement
        timestamps: [],     // store recent frame timestamps
        lastFPSUpdate: 0,   // helps ensure we don't recalc FPS too often

        currentTab: '0',
        tilePlan: {},
        blobURLs: {},
        // New properties for synchronization
        currentPlaybackTime: 0,
        isPlaying: false,

        // Output format control
        outputFormat: 'ktx2', // 'webm' | 'ktx2' (default 'ktx2' initially)

        // KTX2-specific blob URLs (parallel to blobURLs)
        ktx2BlobURLs: {},

        // KTX2 playback state (separate from WebM video timing)
        ktx2Playback: {
            currentLayer: 0,      // current layer index (0 to layerCount-1)
            layerCount: 0,        // total layers in texture array
            isPlaying: false,     // play/pause state
            fps: 30,              // playback speed (layers per second)
            direction: 1,         // 1 = forward, -1 = reverse (for ping-pong mode)
        },

        // Renderer type selection (set during app initialization)
        rendererType: 'webgl',    // 'webgl' | 'webgpu' (determined at runtime)
    }),
    actions: {
        set(key, value) {
            this[key] = value;
        },
        log(message) {
            this.messages.push(message);
        },
        addBlobURL(tileNumber, blob) {
            this.blobURLs[tileNumber] = blob;
        },
        // Register blob URL for specific format and revoke any previous URL for same tile
        registerBlobURL(format, tileNumber, blob) {
            const blobStore = format === 'ktx2' ? this.ktx2BlobURLs : this.blobURLs;
            // Revoke previous URL if exists
            if (blobStore[tileNumber]) {
                URL.revokeObjectURL(blobStore[tileNumber]);
            }
            blobStore[tileNumber] = URL.createObjectURL(blob);
        },
        // Revoke all blob URLs for a specific format
        revokeBlobURLs(format) {
            const blobStore = format === 'ktx2' ? this.ktx2BlobURLs : this.blobURLs;
            Object.values(blobStore).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
            if (format === 'ktx2') {
                this.ktx2BlobURLs = {};
            } else {
                this.blobURLs = {};
            }
        },
        setStatus(key, value) {
            this.status[key] = value;
        },
        // Playback control
        updatePlaybackState({ currentTime, playing }) {
            this.currentPlaybackTime = currentTime;
            this.isPlaying = playing;
        },
        trackFrame() {
            // Called each time a frame is processed/decoded

            const now = performance.now();
            this.timestamps.push(now);
            // Keep a rolling buffer, e.g. last 120 frames
            if (this.timestamps.length > 120) {
                this.timestamps.shift();
            }

            // Optionally, update FPS no more than ~4 times/sec
            if (now - this.lastFPSUpdate > 250) {
                this.lastFPSUpdate = now;

                if (this.timestamps.length > 1) {
                    const first = this.timestamps[0];
                    const last = this.timestamps[this.timestamps.length - 1];
                    const deltaSeconds = (last - first) / 1000;
                    const frameCount = this.timestamps.length - 1;
                    const fps = frameCount / deltaSeconds;
                    this.fpsNow = Math.round(fps);
                }
            }
        }
    },
    getters: {
        // Not to overcomplicate things, but there would also
        // be a separate FPS for encoding tiles. 
        fps() {
            return this.fpsNow
        },
        // Format mode getters for convenient access
        isKTX2Mode() {
            return this.outputFormat === 'ktx2';
        },
        isWebMMode() {
            return this.outputFormat === 'webm';
        }
    }
});
