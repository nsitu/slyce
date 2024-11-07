import { useAppStore } from '../stores/appStore';
import { demuxer } from './webDemuxer.mjs';
import { videoDecoder, decodePackets } from './videoDecoder.mjs';
import { encodeVideo } from './videoEncoder.mjs';

import CanvasManager from '../modules/canvasManager';



const processVideo = async () => {

    const app = useAppStore()  // Pinia store

    // go to the processing tab.
    app.set('currentTab', '2')

    // reset frame counter for a new file
    app.set('frameNumber', 0)
    app.set('readerIsFinished', false)

    app.set('canvasManager', new CanvasManager());

    try {

        app.log(`Loading Demuxer`)
        await demuxer.load(app.file);

        app.log(`Loading Video Decoder Config`)
        let config = await demuxer.getVideoDecoderConfig();
        console.log('getVideoDecoderConfig', config)

        app.set('config', config)

        if (VideoDecoder.isConfigSupported(app.config)) {
            app.log(`Codec ${app.config.codec} is Supported`)
            console.log(`Codec ${app.config.codec} is supported`);

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
                // app.frameNumnber is 0  for some reason on vp8
                // console.log('app.frameNumber, app.frameCount', app.frameNumber, app.frameCount)
                app.log(`Framecount mismatch.`)
            }

            console.log('app.canvasManager', app.canvasManager)
            await encodeVideo();

            app.log(`Done.`)
        }
        else {
            app.log(`Codec ${app.config.codec} is Not Supported`)
            console.error(`Codec ${app.config.codec} is not supported`);
        }



    } catch (error) {
        console.error('Failed to process file:', error);
    }
}

export { processVideo }