<script setup>
    import { downloadBlob } from '../modules/blobDownloader.mjs';

    import VideoPlayer from './VideoPlayer.vue';

    defineProps({
        url: String,
        default: null
    })

</script>

<template>

    <div
        class="flex flex-col items-center gap-2"
        v-if="url"
    >


        <div class="flex items-center gap-2">
            <h3>Processing Complete.</h3>
            <button
                class="bg-blue-500 text-white px-4 py-2 rounded-md"
                @click="downloadBlob(url)"
            >Download</button>
        </div>
        <VideoPlayer :url="url"></VideoPlayer>

    </div>
</template>