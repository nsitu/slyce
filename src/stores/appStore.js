import { defineStore } from 'pinia';

// This store keeps track of the global status of the application
export const useAppStore = defineStore('appStore', {
    state: () => ({
        config: {},
        frameCount: 0,
        frameNumber: 0,
        crossSectionCount: 60,
        crossSectionType: 'planes', // planes, waves
        samplingMode: 'rows',       // rows, columns
        outputMode: 'rows',         // rows, columns
        tileMode: 'tile',           // tile, full
        tileProportion: 'square',       // square, landscape, portrait
        prioritize: 'quantity',         // quantity, quality, powersOfTwo
        potResolution: 512,             // 128, 256, 512, 1024
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
        }
    }
});
