<script setup>
    import { ref } from 'vue';

    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store

    const fileInput = ref(null);
    // Add a method to handle the file selection
    const handleFileChange = () => {
        const files = fileInput.value.files;
        if (files && files.length > 0) {
            app.set('file', files[0])
            app.set('fileURL', URL.createObjectURL(files[0]))
            app.set('currentTab', '1')
        }
    };
</script>

<template>
    <div class="flex gap-4 items-center justify-center w-auto border-2 border-gray-300 rounded-md p-4">
        <h3 class="flex items-center gap-2 text-xl"><img
                src="/video-upload.svg"
                alt="Upload Video"
            ><span>Upload Video</span></h3>
        <span>Drag/Drop anywhere</span>
        <span>or</span>
        <button
            @click=" fileInput.click()"
            class="bg-blue-500 text-white px-4 py-2 rounded-md"
            id="browse-button"
        >Browse...</button>
        <input
            ref="fileInput"
            type="file"
            id="file-input"
            style="display: none;"
            accept="video/*"
            @change="handleFileChange"
        >
        <div id="file-info">
        </div>
    </div>
</template>