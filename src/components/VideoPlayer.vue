<script setup>


    defineProps({
        url: String,
        default: null
    })

</script>


<template>
    <video
        ref="videoElement"
        v-if="url"
        :src="url"
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