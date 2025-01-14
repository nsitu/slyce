<template>
    <div class="p-4">
        <h3 class="text-xl font-semibold mb-4">Results</h3>
        <!-- Parent Container with Dynamic Layout -->
        <div :class="parentContainerClasses">
            <!-- Video Player Container with Dynamic Flex Direction -->
            <div
                v-for="(blob, tileNumber) in app.blobs"
                :key="tileNumber"
                :class="videoPlayerContainerClasses"
            >
                <div class="relative group w-full">
                    <VideoPlayer
                        :url="blob.url"
                        :playbackTime="app.currentPlaybackTime"
                        :isPlaying="app.isPlaying"
                        :isPrimary="tileNumber === '0'"
                        :hasControls="false"
                        @playback-state-change="handlePlaybackStateChange"
                        aria-label="'Video Tile ' + tileNumber"
                        class="w-full h-auto rounded-md"
                    />
                    <!-- Download Button Overlay -->
                    <button
                        :disabled="downloadingTiles.has(blob.url)"
                        class="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                        @click="download(blob.url, tileNumber)"
                        aria-label="'Download Video Tile ' + tileNumber"
                    >
                        <span v-if="downloadingTiles.has(blob.url)">Downloading...</span>
                        <span v-else>Download</span>
                        <!-- Optional: Add a spinner icon -->
                        <svg
                            v-if="downloadingTiles.has(blob.url)"
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
                    <!-- Success and Error Messages -->
                    <span
                        v-if="downloadSuccess[tileNumber]"
                        class="text-green-500 mt-1"
                    >Downloaded!</span>
                    <span
                        v-if="downloadError[tileNumber]"
                        class="text-red-500 mt-1"
                    >Failed to download.</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, reactive } from 'vue';
    import { downloadBlob } from '../modules/blobDownloader.js';
    import { useAppStore } from '../stores/appStore';
    import VideoPlayer from './VideoPlayer.vue';

    // Access the Pinia store
    const app = useAppStore();

    // Computed property to retrieve the current outputMode from the store
    const outputMode = computed(() => app.outputMode);

    // Computed property for the parent container's classes
    const parentContainerClasses = computed(() => {
        return outputMode.value === 'columns'
            ? 'flex flex-row flex-wrap gap-4 justify-start'
            : 'flex flex-col gap-4';
    });

    // Computed property for each video-player-container's classes
    const videoPlayerContainerClasses = computed(() => {
        return outputMode.value === 'columns'
            ? 'w-full sm:w-1/2 md:w-1/3 lg:w-1/4' // Responsive widths for columns
            : 'w-full'; // Full width for rows
    });

    // Reactive sets to track downloading, success, and error states
    const downloadingTiles = reactive(new Set());
    const downloadSuccess = reactive({});
    const downloadError = reactive({});

    // Download function
    const download = async (blobUrl, tileNumber) => {
        if (downloadingTiles.has(blobUrl)) return; // Prevent multiple downloads

        downloadingTiles.add(blobUrl);
        delete downloadSuccess[tileNumber];
        delete downloadError[tileNumber];

        try {
            await downloadBlob(blobUrl, tileNumber, app.fileInfo);
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

    // Handle playback state changes from the first/primary video
    function handlePlaybackStateChange({ currentTime, playing }) {
        app.updatePlaybackState({ currentTime, playing });
    }
</script>

<style scoped>
    .video-player {
        /* Ensure videos are responsive */
        max-width: 100%;
        height: auto;
        border-radius: 0.375rem;
        /* Rounded corners */
    }

    .download-button {
        /* Smooth color transition on hover */
        transition: background-color 0.3s;
    }

    .download-button:hover {
        background-color: #2563eb;
        /* Darker blue on hover */
    }

</style>
