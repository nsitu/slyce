<template>
    <h3>Results</h3>
    <div
        class="flex items-center gap-2 video-player-container"
        v-for="(blob, tileNumber) in app.blobs"
        :key="tileNumber"
    >
        <VideoPlayer
            :url="blob.url"
            :playbackTime="app.currentPlaybackTime"
            :isPlaying="app.isPlaying"
            :isPrimary="tileNumber === '0'"
            @playback-state-change="handlePlaybackStateChange"
        />
        <button
            class="bg-blue-500 text-white px-4 py-2 rounded-md"
            @click="downloadBlob(blob.url)"
        >
            Download
        </button>
    </div>
</template>

<script setup>
    import { downloadBlob } from '../modules/blobDownloader.js';
    import { useAppStore } from '../stores/appStore';
    import VideoPlayer from './VideoPlayer.vue';

    const app = useAppStore();

    // Handle playback state changes from the first/primary video
    function handlePlaybackStateChange({ currentTime, playing }) {
        app.updatePlaybackState({ currentTime, playing });
    }

</script>

<style scoped>
    .video-player-container {
        width: 20rem;
        margin-bottom: 0.1rem;
    }

</style>