import { defineStore } from 'pinia';

// This store keeps track of the global status of the application
export const useAppStore = defineStore('appStore', {
    state: () => ({
        config: {},
        frameCount: 0,
        frameNumber: 0,
        useShortSide: true,
        crossSectionCount: 60,
        crossSectionType: 'plane', // plane, wave
        samplingMode: 'rows',       // rows, columns
        outputMode: 'rows',         // rows, columns
        tileMode: 'tile',           // tile, full
        tileProportion: 'square',       // square, landscape, portrait
        prioritize: 'quantity',         // quantity, quality
        readerIsFinished: false,
        fileInfo: null,
        samplePixelCount: 0, /** equals width or height depending on samplingMode */
        messages: [],
        status: {},
        pauseDecode: null,
        resumeDecode: null,
        blob: null,
        blobURL: null,

        fpsNow: 0,          // current FPS measurement
        timestamps: [],     // store recent frame timestamps
        lastFPSUpdate: 0,   // helps ensure we don't recalc FPS too often

        currentTab: '0',
        // Canvasses are
        // -provided by canvasPool
        // -populated with samples
        // -encoded into animations
        canvasses: {},
        tilePlan: {},
        blobs: {},
        // New properties for synchronization
        currentPlaybackTime: 0,
        isPlaying: false,
    }),
    actions: {
        set(key, value) {
            this[key] = value;
        },
        log(message) {
            this.messages.push(message);
        },
        allocateCanvas(tileNumber, canvas) {
            // initialize an array if needed for this particualr tileNumber
            this.canvasses[tileNumber] = this.canvasses[tileNumber] || [];
            this.canvasses[tileNumber].push(canvas);
        },
        createBlob(tileNumber, blob) {
            // Initialize the blob for the given tileNumber
            this.blobs[tileNumber] = blob;
        },
        setStatus(key, value) {
            this.status[key] = value;
        },
        initializeDecodeControl() {
            this.pauseDecode = new Promise(resolve => {
                this.resumeDecode = resolve;
            });
        },
        async pauseIfNeeded() {
            if (this.pauseDecode) {
                await this.pauseDecode;
            }
        },
        resumeDecoding() {
            if (this.resumeDecode) {
                // Resolve the promise to continue the process
                this.resumeDecode();
                // Reinitialize pause and resume promises
                this.initializeDecodeControl();
            }
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
        fps() {
            return this.fpsNow
        }
    }
});
