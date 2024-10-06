<script setup>

    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store

</script>


<template>
    <video
        ref="videoElement"
        v-if="app.blobURL"
        :src="app.blobURL"
        controls
        loop
        autoplay
    ></video>
</template>
<style>
    video {
        max-width: 100%;
    }
</style>