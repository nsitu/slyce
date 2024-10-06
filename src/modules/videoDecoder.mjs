import { useAppStore } from '../stores/appStore';


const videoDecoder = new VideoDecoder({
    output: (videoFrame) => {
        const app = useAppStore()  // Pinia store
        app.canvasManager.drawFrame(videoFrame, app.frameNumber);
        // the canvasManager will close the videoFrame
        app.frameNumber++;
        let memoryUsage = '';
        // if using google chrome, show memory usage
        if (performance.memory) {
            const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
            memoryUsage = `Used: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB <BR/>
                Total: ${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB <BR/>
                Limit: ${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        }
        // update the status box with a snapshot of what's happening
        app.set('status', `
            Stream: ${app.readerIsFinished ? 'finished' : 'reading'}</br>
        FPS: ${app.fps} </br>
        Queue size: ${videoDecoder.decodeQueueSize}.<br/>
        Decoded frame: ${app.frameNumber} of ${app.frameCount}<br/> ${memoryUsage}
        `)
        // app.resume()
    },
    error: e => console.error('Video decode error:', e)
});


const decodePackets = async (reader) => {
    const app = useAppStore()  // Pinia store
    try {
        const { done, value } = await reader.read();

        if (done) {
            await videoDecoder.flush();
            app.log('Decoder flushed, all frames processed.');
            return;
        }
        //if (decoder.decodeQueueSize > 400) { await pauseDecode; }
        // Decode the video chunk
        videoDecoder.decode(new EncodedVideoChunk({
            type: value.keyframe ? 'key' : 'delta',
            timestamp: value.timestamp,
            duration: value.duration,
            data: value.data,
            transfer: [value.data.buffer]
        }));

        // Continue decoding the next packet
        await decodePackets(reader);

    } catch (readError) {
        console.error('Error while reading packets:', readError);
    }
}

export { videoDecoder, decodePackets }