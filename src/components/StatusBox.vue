<script setup>
    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store

</script>
<template>
    <div
        v-if="app.status"
        id="status-box"
        v-html="app.status"
    >
    </div>
</template>
<style>
    #status-box {
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
    }
</style>