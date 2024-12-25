<script setup>

    // This component embeds a preview of the uploaded video file
    // it also displays metadata about the video 
    // It assumes that the relevant data has been added to the store
    // app.fileURL  a blob URL for the uploaded video file
    // app.fileInfo  an object with metadata about the video file

    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store  

    import { useNiceFormat } from '../composables/useNiceFormat';
    const { niceCodec, niceDuration, niceFrameRate, niceBitRate } = useNiceFormat();

    import VideoPlayer from './VideoPlayer.vue';

</script>

<template>
    <div
        class="flex flex-col items-start gap-2"
        v-if="app?.fileInfo?.name"
    >
        <div class="smallPlayer">
            <VideoPlayer
                v-if="app.fileURL"
                :url="app.fileURL"
            ></VideoPlayer>
        </div>
        <table>
            <tbody>
                <tr>
                    <td class="file-info-label">File Name <span class="material-symbols-outlined">
                            video_file
                        </span></td>
                    <td class="file-info-value">{{ app.fileInfo?.name }}</td>
                </tr>

                <tr>
                    <td class="file-info-label">Codec <span class="material-symbols-outlined">
                            frame_source
                        </span></td>
                    <td class="file-info-value">{{ niceCodec(app.fileInfo?.codec_string) }}</td>
                </tr>
                <tr>
                    <td class="file-info-label">Codec String <span class="material-symbols-outlined">
                            barcode
                        </span></td>
                    <td class="file-info-value">{{ app.fileInfo?.codec_string }}</td>
                </tr>
                <tr>
                    <td class="file-info-label">Duration <span class="material-symbols-outlined">
                            timer
                        </span></td>
                    <td class="file-info-value">{{ niceDuration(app.fileInfo?.duration) }}</td>
                </tr>
                <tr>
                    <td class="file-info-label">Frame Rate <span class="material-symbols-outlined">
                            speed
                        </span></td>
                    <td class="file-info-value">{{ niceFrameRate(app.fileInfo?.r_frame_rate) }}</td>
                </tr>
                <tr>
                    <td class="file-info-label">Frame Count <span class="material-symbols-outlined">
                            calculate
                        </span></td>
                    <td class="file-info-value">{{ app.fileInfo?.nb_frames }}</td>
                </tr>
                <tr>
                    <td class="file-info-label">Resolution <span class="material-symbols-outlined">
                            view_compact
                        </span></td>
                    <td class="file-info-value">{{ app.fileInfo?.width }} x {{ app.fileInfo?.height }} pixels(w x h)
                    </td>
                </tr>
                <tr>
                    <td class="file-info-label"> Rotation <span class="material-symbols-outlined">
                            rotate_right
                        </span></td>
                    <td class="file-info-value"> {{ app.fileInfo?.rotation }} degrees </td>
                </tr>
                <tr>
                    <td class="file-info-label"> Bit Rate <span class="material-symbols-outlined">
                            equalizer
                        </span></td>
                    <td class="file-info-value">{{ niceBitRate(app.fileInfo?.bit_rate) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div v-else>
        Loading...
    </div>
</template>
<style scoped>

    .smallPlayer {
        max-width: 20vw;
    }

    #file-info table {
        background-color: #eee;
    }

    #file-info tr {
        border-bottom: 1px solid #fff;
    }


    .file-info-label {
        display: flex;
        align-items: center;
        justify-content: end;
        gap: 0.5rem;
        padding: 0 0 0 0.5rem;
    }

    .file-info-value {
        text-align: left;
        padding-left: 0rem;
        padding: 0 0.5rem;
    }
</style>