<script setup>
</script>
<template>
    <div
        id="settings"
        class="flex flex-col gap-5 items-start"
    >
        <h3 class="text-xl">Settings</h3>
        <div class="flex gap-2 justify-start items-center">
            <span>Sample</span>
            <select
                id="sampling-mode"
                name="sampling-mode"
                class="p-2 border-2 rounded-md"
            >
                <option value="rows">rows</option>
                <option value="columns">columns</option>
            </select>
            <span>of pixels from each frame. </span>

        </div>
        <div class="flex gap-2 justify-start items-center">
            <span>Sample from </span>
            <input
                id="sample-location-count"
                class="py-1.5 px-2 border-2 rounded-md"
                type="number"
                placeholder="60"
                min="1"
                max="240"
                value="60"
            >
            <span> locations along a</span>
            <select
                id="distribution-mode"
                name="distribution-mode"
                class="p-2 border-2 rounded-md"
            >
                <option value="cosine"> cosine </option>
                <option value="linear"> linear</option>
            </select>
            <span> distribution.</span>

        </div>

        <div class="flex gap-2 justify-start items-center">
            <span>For each location, join samples from all frames as</span>
            <select
                id="output-mode"
                name="output-mode"
                class="p-2 border-2 rounded-md"
            >
                <option value="rows">rows</option>
                <option value="columns">columns</option>
            </select>
            <span>to form a new <i>"cross section"</i>.</span>
        </div>

        <div class="flex gap-2 justify-start items-center">
            <span>Render each cross section as an ordered sequence of</span>
            <select
                id="proportion"
                name="proportion"
                class="p-2 border-2 rounded-md"
            >
                <option value="duration">square (1:1)</option>
                <option value="resolution">rectangular (16:9)</option>
            </select>
            <span>tiles. </span>
        </div>

        <div class="flex gap-2 justify-start items-center">
            <span>Prioritize</span>
            <select
                id="prioritize"
                name="prioritize"
                class="p-2 border-2 rounded-md"
            >
                <option value="duration">duration over resolution</option>
                <option value="resolution">resolution over duration</option>
            </select>
            <span>to determine how many tiles are in the sequence.</span>
        </div>

        <div class="flex gap-2 justify-start items-center">
            <span>For each position in the tile sequence, create a </span>
            <select
                id="video-type"
                name="video-type"
                class="p-2 border-2 rounded-md"
            >
                <option value="looping">looping</option>
                <option value="linear">linear</option>
            </select>
            <span>video from all tiles at that location.</span>
        </div>



    </div>
</template>