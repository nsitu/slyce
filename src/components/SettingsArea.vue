<script setup>

    import { watch, watchEffect, ref, onMounted, computed } from 'vue';
    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store

    import { useTilePlan } from '../composables/useTilePlan';
    const { tilePlan } = useTilePlan();

    import { getMetaData } from '../modules/metaDataExtractor';
    import { processVideo } from '../modules/videoProcessor';

    import Tile from './Tile.vue';
    // import SkipMessage from './SkipMessage.vue';
    // import ScaleMessage from './ScaleMessage.vue'; 
    import ExplanatoryMessages from './ExplanatoryMessages.vue';


    // when a file is uploaded get the metadata
    watch(() => app.file, () => getMetaData())

    import FileInfo from './FileInfo.vue';
    import Select from 'primevue/select';
    import InputText from 'primevue/inputtext';
    import InputNumber from 'primevue/inputnumber';





    // Watch for changes in samplingMode and adjust samplePixelCount accordingly
    watchEffect(() => {
        if (app.fileInfo?.height && app.fileInfo?.width) {
            if (app.samplingMode == 'columns') {
                app.samplePixelCount = app.fileInfo?.height
            }
            if (app.samplingMode == 'rows') {
                app.samplePixelCount = app.fileInfo?.width
            }
        }
    });



    import RadioButton from 'primevue/radiobutton';







</script>
<template>

    <div class="flex  items-start gap-5">
        <FileInfo v-if="app.file"></FileInfo>

        <div
            id="settings"
            class="flex flex-col gap-3 items-start"
        >
            <h3 class="text-xl">Sampling</h3>


            <div class="flex w-full gap-6">
                <label
                    style="max-width: 15rem;"
                    class="flex flex-col grow items-start gap-2"
                    for="planes"
                    :class="(app.crossSectionType === 'planes') ? 'activeLabel' : ''"
                >

                    <div class="flex items-center gap-2 w-full">
                        <RadioButton
                            v-model="app.crossSectionType"
                            inputId="planes"
                            name="crossSectionType"
                            value="planes"
                        />
                        <span>Planes</span>
                        <svg
                            class="ml-auto"
                            xmlns="http://www.w3.org/2000/svg"
                            version="1.1"
                            viewBox="0 0 100 30"
                        >
                            <line
                                x1="0"
                                y1="2.3"
                                x2="100"
                                y2="2.3"
                            />
                            <line
                                x1="0"
                                y1="5.1"
                                x2="100"
                                y2="5.1"
                            />
                            <line
                                x1="0"
                                y1="20.7"
                                x2="100"
                                y2="20.7"
                            />
                            <line
                                x1="0"
                                y1="15"
                                x2="100"
                                y2="15"
                            />
                            <line
                                x1="0"
                                y1="27.7"
                                x2="100"
                                y2="27.7"
                            />
                            <line
                                x1="0"
                                y1="24.9"
                                x2="100"
                                y2="24.9"
                            />
                            <line
                                x1="0"
                                y1="9.3"
                                x2="100"
                                y2="9.3"
                            />
                        </svg>
                    </div>
                    <small>Sample pixels via an eased distribution of planes</small>
                </label>
                <label
                    class="flex flex-col grow items-start gap-2"
                    style="max-width: 15rem;"
                    for="waves"
                    :class="(app.crossSectionType === 'waves') ? 'activeLabel' : ''"
                >
                    <div class="flex items-center gap-2 w-full">
                        <RadioButton
                            v-model="app.crossSectionType"
                            inputId="waves"
                            name="crossSectionType"
                            value="waves"
                        />

                        <span>Waves</span>
                        <svg
                            viewBox="0 0 100 30"
                            class="ml-auto"
                        >
                            <path
                                d="M0,0c9.1,0,17.1,7.5,25,15,8,7.5,15.9,15,25,15s17.1-7.5,25-15c8-7.5,15.9-15,25-15" />
                            <path d="M0,15c7.9,7.5,15.9,15,25,15s17.1-7.5,25-15C58,7.5,65.9,0,75,0s17.1,7.5,25,15" />
                            <path
                                d="M0,30c9.1,0,17.1-7.5,25-15C33,7.5,40.9,0,50,0s17.1,7.5,25,15c8,7.5,15.9,15,25,15" />
                            <path d="M0,15C8,7.5,15.9,0,25,0s17.1,7.5,25,15c8,7.5,15.9,15,25,15s17.1-7.5,25-15" />
                        </svg>
                    </div>
                    <small>Sample pixels via evenly distributed corrugated forms</small>
                </label>
            </div>


            <div class="flex gap-2 justify-start items-center">

                <span>From each frame, sample</span>
                <InputNumber
                    v-model="app.crossSectionCount"
                    placeholder="60"
                    :min="1"
                    :max="240"
                >
                </InputNumber>
                <Select
                    v-model="app.samplingMode"
                    :options="['columns', 'rows']"
                />

                <span>of</span>
                <span
                    v-if="app.fileInfo?.width && app.samplingMode == 'rows'"
                    class="sample-pixel-count"
                >
                    {{ app.fileInfo.width }} pixels</span>
                <span
                    v-if="app.fileInfo?.height && app.samplingMode == 'columns'"
                    class="sample-pixel-count"
                >
                    {{ app.fileInfo.height }} pixels</span>

            </div>


            <h3 class="text-xl">Output</h3>

            <div class="flex w-full gap-6">
                <label
                    style="max-width: 15rem;"
                    class="flex flex-col grow items-start gap-2"
                    for="webm"
                    :class="(app.outputFormat === 'webm') ? 'activeLabel' : ''"
                >
                    <div class="flex items-center gap-2 w-full">
                        <RadioButton
                            v-model="app.outputFormat"
                            inputId="webm"
                            name="outputFormat"
                            value="webm"
                        />
                        <span>Video Loop</span>
                    </div>
                </label>
                <label
                    style="max-width: 15rem;"
                    class="flex flex-col grow items-start gap-2"
                    for="ktx2"
                    :class="(app.outputFormat === 'ktx2') ? 'activeLabel' : ''"
                >
                    <div class="flex items-center gap-2 w-full">
                        <RadioButton
                            v-model="app.outputFormat"
                            inputId="ktx2"
                            name="outputFormat"
                            value="ktx2"
                        />
                        <span>KTX2 Texture Array</span>
                    </div>
                </label>
            </div>

            <div class="flex gap-2 justify-start items-center">
                <span>Join samples as</span>

                <Select
                    v-model="app.outputMode"
                    :options="['columns', 'rows']"
                />
                <span>to form</span>
                <Select
                    v-model="app.tileMode"
                    :options="[{
                        name: 'full size',
                        value: 'full'
                    }, {
                        name: 'tiled',
                        value: 'tile'
                    }]"
                    optionValue="value"
                    optionLabel="name"
                />
                <span>cross-sections.</span>
            </div>
            <div
                v-if="app.tileMode === 'tile'"
                class="flex gap-2 justify-start items-center"
            >
                <span>Make </span>

                <Select
                    v-model="app.tileProportion"
                    :options="[{
                        name: 'square (1:1)',
                        value: 'square'
                    }, {
                        name: 'landscape (16:9)',
                        value: 'landscape'
                    }, {
                        name: 'portrait (9:16)',
                        value: 'portrait'
                    }]"
                    optionValue="value"
                    optionLabel="name"
                />
                <span>tiles optimized for</span>
                <Select
                    v-model="app.prioritize"
                    :options="[{
                        name: 'quantity',
                        value: 'quantity'
                    }, {
                        name: 'quality',
                        value: 'quality'
                    }, {
                        name: 'powers of two',
                        value: 'powersOfTwo'
                    }]"
                    optionValue="value"
                    optionLabel="name"
                />
            </div>
            <div
                v-if="app.tileMode === 'tile'"
                class="flex gap-2 justify-start items-center"
            >


                <div
                    v-if="app.prioritize === 'powersOfTwo'"
                    class="flex gap-2 justify-start items-center"
                >
                    <span>with</span>
                    <Select
                        v-model="app.potResolution"
                        :options="[{
                            name: '128px',
                            value: 128
                        }, {
                            name: '256px',
                            value: 256
                        }, {
                            name: '512px',
                            value: 512
                        }, {
                            name: '1024px',
                            value: 1024
                        }]"
                        optionValue="value"
                        optionLabel="name"
                    />
                    <span>resolution</span>
                </div>
                <div
                    v-if="(app.prioritize === 'quantity' || app.prioritize === 'powersOfTwo')"
                    class="flex gap-2 justify-start items-center"
                >
                    <span>using</span>
                    <Select
                        v-model="app.downsampleStrategy"
                        :options="[{
                            name: 'per sample',
                            value: 'perSample'
                        }, {
                            name: 'upfront',
                            value: 'upfront'
                        }]"
                        optionValue="value"
                        optionLabel="name"
                    />
                    <span>down-scaling</span>
                </div>
            </div>
            <ExplanatoryMessages
                style="max-width: 31.5rem;"
                :plan="tilePlan"
            ></ExplanatoryMessages>

        </div>

        <div class="flex flex-col items-start gap-2">
            <div
                v-if="tilePlan?.tiles?.length"
                :class="(app.outputMode == 'columns') ? 'tile-container-columns' : 'tile-container-rows'"
            >
                <Tile
                    v-for="tile in tilePlan.tiles"
                    :start="tile.start"
                    :end="tile.end"
                    :width="tilePlan.width"
                    :height="tilePlan.height"
                ></Tile>
            </div>



            <h3 class="text-xl">Are you ready?</h3>
            <button
                id="process-button"
                class="bg-blue-500 text-white px-4 py-2 rounded-md"
                @click="processVideo({
                    file: app.file,
                    tilePlan: tilePlan,
                    samplingMode: app.samplingMode,
                    outputMode: app.outputMode,
                    config: app.config,
                    frameCount: app.frameCount,
                    fileInfo: app.fileInfo,
                    crossSectionCount: app.crossSectionCount,
                    crossSectionType: app.crossSectionType,
                })"
            >Process</button>
        </div>

    </div>
</template>
<style scoped>

    span.sample-pixel-count {
        font-variant: small-caps;
        color: #10b981;
        border: 1px solid #10b981;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
    }

    .tile-container-columns {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }

    /* Multi-column newspaper-style layout that flows top-to-bottom, then left-to-right */
    .tile-container-rows {
        column-count: 4;
        column-gap: 0.5rem;
        max-height: 80vh;
        /* Adjust based on your needs */
    }

    /* Prevent tiles from breaking across columns */
    .tile-container-rows>* {
        break-inside: avoid;
        margin-bottom: 0.5rem;
    }



    label {
        box-shadow: rgba(0, 30, 43, 0.3) 0px 4px 10px -4px;
        padding: 1.5rem;
        border-radius: 1rem;
        cursor: pointer;
        outline: 2px solid #eee;
    }

    label span {
        font-weight: 700;
    }

    label:hover {
        outline: 2px solid lightgreen;
    }

    label.activeLabel {
        outline: 2px solid #10b981;
    }

    label svg {
        background: #ddd;
        width: 6rem;
        margin-left: auto;
    }

    label.activeLabel svg {
        background: #10b981;
    }

    label svg line,
    label svg path {
        fill: none;
        stroke: #fff;
        stroke-miterlimit: 10;
    }

    :deep(.p-inputnumber-input) {
        width: 4rem;
    }
</style>