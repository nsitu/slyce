<script setup>

    import { useAppStore } from './stores/appStore';
    const app = useAppStore()  // Pinia store

    import { onMounted } from 'vue';

    import { dragAndDrop } from './modules/dragAndDropHandler';
    import { processVideo } from './modules/videoProcessor';
    import CanvasManager from './modules/canvasManager';

    import Header from './components/Header.vue'
    import UploadArea from './components/UploadArea.vue';
    import ActivityLog from './components/ActivityLog.vue';
    import StatusBox from './components/StatusBox.vue';
    import SettingsArea from './components/SettingsArea.vue';
    import FileInfo from './components/FileInfo.vue';
    import VideoPlayer from './components/VideoPlayer.vue';

    onMounted(() => {
        app.set('canvasManager', new CanvasManager());
        dragAndDrop((file) => processVideo(file));
    });
</script>

<template>
    <main>
        <Header></Header>
        <UploadArea></UploadArea>
        <FileInfo></FileInfo>
        <SettingsArea></SettingsArea>
        <div class="flex gap-4">
            <ActivityLog></ActivityLog>
            <StatusBox></StatusBox>
        </div>
        <VideoPlayer></VideoPlayer>
    </main>


</template>

<style>
    main {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        min-height: 100vh;
    }

</style>
