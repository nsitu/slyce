<script setup>
    // import { compute } from 'three/webgpu';
    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store


</script>
<template>
    <div
        v-for="status in Object.entries(app.status)"
        id="status-box"
    >
        <h4 v-if="status[0]">{{ status[0] }}</h4>
        <div
            v-if="status[1]"
            v-html="status[1]"
        ></div>


    </div>
</template>
<style>
    #status-box {
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
    }
</style>