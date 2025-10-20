<template>
    <div class="p-4">
        <h3 class="text-xl font-semibold mb-4">Results</h3>

        <!-- Grid Renderer (format-specific) -->
        <div class="mb-4">
            <!-- WebM Video Grid -->
            <VideoGrid
                v-if="app.outputFormat === 'webm'"
                :blobURLs="app.blobURLs"
                :outputMode="app.outputMode"
                :playbackTime="app.currentPlaybackTime"
                :isPlaying="app.isPlaying"
                @playback-state-change="handlePlaybackStateChange"
            />

            <!-- KTX2 Three.js Renderer -->
            <TileGridRenderer
                v-else-if="app.outputFormat === 'ktx2'"
                :ktx2BlobURLs="app.ktx2BlobURLs"
                :outputMode="app.outputMode"
            />
        </div>

        <!-- Download UI (format-agnostic) -->
        <div class="download-section mt-6">
            <h4 class="text-lg font-semibold mb-3">Download Tiles</h4>

            <!-- Download All Button -->
            <button
                @click="downloadAll"
                :disabled="isDownloadingZip"
                class="download-all-button bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors duration-300 mb-4 flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <span v-if="isDownloadingZip">Creating ZIP...</span>
                <span v-else>Download All as ZIP</span>

                <svg
                    v-if="isDownloadingZip"
                    class="animate-spin h-5 w-5 text-white ml-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle>
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                </svg>
            </button>

            <div class="flex flex-wrap gap-2">
                <button
                    v-for="(blobURL, tileNumber) in currentBlobURLs"
                    :key="tileNumber"
                    :disabled="downloadingTiles.has(blobURL)"
                    class="download-button bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center"
                    @click="download(blobURL, tileNumber)"
                    :aria-label="`Download Tile ${tileNumber}`"
                >
                    <span v-if="downloadingTiles.has(blobURL)">Downloading...</span>
                    <span v-else>Tile {{ tileNumber }}</span>

                    <!-- Spinner -->
                    <svg
                        v-if="downloadingTiles.has(blobURL)"
                        class="animate-spin h-5 w-5 text-white ml-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                    </svg>

                    <!-- Success/Error indicators -->
                    <span
                        v-if="downloadSuccess[tileNumber]"
                        class="ml-2"
                    >✓</span>
                    <span
                        v-if="downloadError[tileNumber]"
                        class="ml-2"
                    >✗</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, reactive, ref } from 'vue';
    import { downloadBlob } from '../modules/blobDownloader.js';
    import { downloadAllAsZip } from '../modules/zipDownloader.js';
    import { useAppStore } from '../stores/appStore';
    import VideoGrid from './VideoGrid.vue';
    import TileGridRenderer from './TileGridRenderer.vue';

    // Access the Pinia store
    const app = useAppStore();

    // Computed property for current blob URLs based on format
    const currentBlobURLs = computed(() => {
        return app.outputFormat === 'ktx2' ? app.ktx2BlobURLs : app.blobURLs;
    });

    // Reactive sets to track downloading, success, and error states
    const downloadingTiles = reactive(new Set());
    const downloadSuccess = reactive({});
    const downloadError = reactive({});
    const isDownloadingZip = ref(false);

    // Download function
    const download = async (blobUrl, tileNumber) => {
        if (downloadingTiles.has(blobUrl)) return; // Prevent multiple downloads

        downloadingTiles.add(blobUrl);
        delete downloadSuccess[tileNumber];
        delete downloadError[tileNumber];

        try {
            // Determine format descriptor based on output format
            const format = app.outputFormat === 'ktx2'
                ? { mime: 'image/ktx2', extension: 'ktx2' }
                : { mime: 'video/webm', extension: 'webm' };

            await downloadBlob(blobUrl, tileNumber, app.fileInfo, format);
            downloadSuccess[tileNumber] = true;
            // Remove success message after 3 seconds
            setTimeout(() => delete downloadSuccess[tileNumber], 3000);
        } catch (error) {
            console.error(`Download failed for tile ${tileNumber}:`, error);
            downloadError[tileNumber] = true;
            // Remove error message after 3 seconds
            setTimeout(() => delete downloadError[tileNumber], 3000);
        } finally {
            downloadingTiles.delete(blobUrl);
        }
    };

    // Download all tiles as ZIP
    const downloadAll = async () => {
        if (isDownloadingZip.value) return;

        isDownloadingZip.value = true;

        try {
            const format = app.outputFormat === 'ktx2'
                ? { mime: 'image/ktx2', extension: 'ktx2' }
                : { mime: 'video/webm', extension: 'webm' };

            await downloadAllAsZip(currentBlobURLs.value, app.fileInfo, format);
        } catch (error) {
            console.error('Failed to create ZIP:', error);
            alert('Failed to create ZIP file. Files may be too large.');
        } finally {
            isDownloadingZip.value = false;
        }
    };

    // Handle playback state changes from the first/primary video
    function handlePlaybackStateChange({ currentTime, playing }) {
        app.updatePlaybackState({ currentTime, playing });
    }
</script>

<style scoped>
    .download-section {
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 0.5rem;
    }

    .download-button {
        min-width: 100px;
        transition: background-color 0.3s;
    }

    .download-button:hover:not(:disabled) {
        background-color: #2563eb;
    }

    .download-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
