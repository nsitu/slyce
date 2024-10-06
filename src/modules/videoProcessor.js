import { useAppStore } from '../stores/appStore';
import { demuxer } from './webDemuxer.mjs';
import { videoDecoder, decodePackets } from './videoDecoder.mjs';
import { encodeVideo } from './videoEncoder.mjs';
import { downloadBlob } from './blobDownloader.mjs';

const processVideo = async (file) => {

    const app = useAppStore()  // Pinia store

    // reset counter for a new file
    app.set('frameCount', 0)
    app.set('frameNumber', 0)
    app.set('readerIsFinished', false)

    // if a new file is loaded, reset the canvas manager
    if (app.currentFile != '' && app.currentFile != file.name) {
        app.canvasManager.clearAll()
    }
    app.set('currentFile', file.name)
    try {
        app.log(`Loading Demuxer`)
        await demuxer.load(file);
        app.log(`Loading Stream Info`)
        let info = await demuxer.getAVStream();
        app.set('frameCount', Number(info.nb_frames))
        app.log('Displaying File Metadata')
        app.set('fileInfo', { ...info, name: file.name })
        app.log(`Loading Video Decoder Config`)
        let config = await demuxer.getVideoDecoderConfig();
        app.set('config', config)

        if (VideoDecoder.isConfigSupported(app.config)) {
            app.log(`Codec ${app.config.codec} is Supported`)
            console.log(`Codec ${app.config.codec} is supported`);
        }
        else {
            app.log(`Codec ${app.config.codec} is Not Supported`)
            console.error(`Codec ${app.config.codec} is not supported`);
        }
        // pass along details about the video to the canvas manager
        // make sure the canvasManager exists.
        await app.canvasManager.configure({
            videoWidth: app.config.codedWidth,
            videoHeight: app.config.codedHeight,
            frameCount: app.frameCount,
            useShortSide: app.useShortSide
        });


        videoDecoder.configure({
            codec: app.config.codec,
            width: app.config.codedWidth,
            height: app.config.codedHeight,
            description: app.config.description,
            hardwareAcceleration: 'prefer-hardware', // default is 'prefer-hardware'
            latencyMode: 'quality'  // default is 'quality', see also: realtime.
        });

        // Read and decode video packets
        const stream = demuxer.readAVPacket(0, 0, 0, -1)
        const reader = stream.getReader()
        // pass along ReadableStreamDefaultReader for decoding
        await decodePackets(reader);

        app.log(`Decoded ${app.frameNumber} of ${app.frameCount} frames.`);

        if (app.frameNumber !== app.frameCount) {
            app.log(`Framecount mismatch.`)
        }
        await encodeVideo();

        app.log(`Downloading video...`)
        downloadBlob(app.blob)
        app.log(`Done.`)


    } catch (error) {
        console.error('Failed to process file:', error);
    }
}

export { processVideo }