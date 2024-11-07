<script setup>

    import { watch, ref, computed } from 'vue';
    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store


    import { getMetaData } from '../modules/metaDataExtractor';
    import { processVideo } from '../modules/videoProcessor';

    // when a file is uploaded get the metadata
    watch(() => app.file, () => getMetaData())



    const tileCount = computed(() => {

        if (app.fileInfo?.width && app.fileInfo?.height && app.frameCount) {
            if (app.prioritize == 'resolution') {
                if (app.samplingMode == 'rows') {
                    return Math.floor(app.frameCount / app.fileInfo.width)
                }
                else if (app.samplingMode == 'columns') {
                    return Math.floor(app.frameCount / app.fileInfo.height)
                }
            }
            else if (app.prioritize == 'duration') {
                if (app.samplingMode == 'rows') {
                    return Math.floor(app.frameCount / app.fileInfo.width) + 1
                    // return Math.floor(app.frameCount / ())
                }
                else if (app.samplingMode == 'columns') {
                    return Math.floor(app.frameCount / app.fileInfo.height) + 1
                    // return Math.floor(app.frameCount / ())
                }
            }

        }
    })
    import FileInfo from './FileInfo.vue';


    import Select from 'primevue/select';
    import InputText from 'primevue/inputtext';
    import InputNumber from 'primevue/inputnumber';

    import SettingsDiagram from './SettingsDiagram.vue';

    // Watch for changes in crossSectionType and adjust distributionMode accordingly
    watch(() => app.crossSectionType, (newType) => {
        if (newType === 'planar' && app.distributionMode !== 'cosine') {
            app.distributionMode = 'cosine';
        } else if (newType === 'corrugated' && app.distributionMode !== 'linear') {
            app.distributionMode = 'linear';
        }
    });

    // Watch for changes in distributionMode and adjust crossSectionType accordingly
    watch(() => app.distributionMode, (newMode) => {
        if (newMode === 'cosine' && app.crossSectionType !== 'planar') {
            app.crossSectionType = 'planar';
        } else if (newMode === 'linear' && app.crossSectionType !== 'corrugated') {
            app.crossSectionType = 'corrugated';
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
            <h3 class="text-xl">Cross Section</h3>
            <p>What kind of cross section do you want to create?</p>


            <div class="flex w-full gap-6">
                <label
                    class="flex flex-col grow items-start gap-2"
                    for="planar"
                    :class="(app.crossSectionType === 'planar') ? 'activeLabel' : ''"
                >

                    <div class="flex items-center gap-2 w-full">
                        <RadioButton
                            v-model="app.crossSectionType"
                            inputId="planar"
                            name="crossSectionType"
                            value="planar"
                        />
                        <span>Planar</span>
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
                    for="corrugated"
                    :class="(app.crossSectionType === 'corrugated') ? 'activeLabel' : ''"
                >
                    <div class="flex items-center gap-2 w-full">
                        <RadioButton
                            v-model="app.crossSectionType"
                            inputId="corrugated"
                            name="crossSectionType"
                            value="corrugated"
                        />

                        <span>Corrugated</span>
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
                    <small>Sample pixels via a linear distribution of waveforms</small>
                </label>
            </div>

            <h3 class="text-xl">Sampling Configuration</h3>

            <div class="flex gap-2 justify-start items-center">

                <span>Sample</span>
                <InputNumber
                    v-model="app.crossSectionCount"
                    placeholder="60"
                    :min="1"
                    :max="240"
                >
                </InputNumber>
                <Select
                    v-model="app.samplingMode"
                    :options="['rows', 'columns']"
                />
                <span>of pixels from each frame. </span>

            </div>


            <h3 class="text-xl">Output and Rendering</h3>

            <div class="flex gap-2 justify-start items-center">
                <span>Join samples as</span>

                <Select
                    v-model="app.outputMode"
                    :options="['rows', 'columns']"
                />
                <span>to form a</span>
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
                <span>cross-section.</span>
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
                        name: 'rectangular (16:9)',
                        value: 'rectangular'
                    }]"
                    optionValue="value"
                    optionLabel="name"
                />
                <span>tiles optimized for</span>
                <Select
                    v-model="app.prioritize"
                    :options="[{
                        name: 'duration',
                        value: 'duration'
                    }, {
                        name: 'resolution',
                        value: 'resolution'
                    }]"
                    optionValue="value"
                    optionLabel="name"
                />
            </div>




        </div>




        <div class="flex flex-col items-start gap-2">
            <div v-if="tileCount">
                <div
                    v-for="square in Array.from({ length: tileCount })"
                    class="tile"
                ></div>
            </div>

            <!-- In the case of a tiled cross section
             it would be nice to show a preview of the tiles here 
             to illustrate tiling strategies.
             -prioritizing duration
            
             e.g. for video of 320x240 pixels resolution with length of 300 frames.
             how many tiles would it take to fill 
    
                 https://chatgpt.com/c/672d2e04-f4cc-8012-82f1-12f7291b6c9d

              -prioritizing resolution

            
            


             -->

            <!-- <SettingsDiagram>

            </SettingsDiagram> -->

            <h3 class="text-xl">Are you ready?</h3>
            <button
                id="process-button"
                class="bg-blue-500 text-white px-4 py-2 rounded-md"
                @click="processVideo()"
            >Process</button>
        </div>

    </div>
</template>
<style scoped>
    .tile {
        width: 100px;
        height: 100px;
        background: #666;
        border: 2px solid white;
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