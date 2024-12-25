import { useAppStore } from '../stores/appStore';
import { videoDecoder } from './videoDecoder.js';
const resourceUsageReport = async () => {

    const app = useAppStore();

    let memoryUsage = '';
    // if using google chrome, show memory usage
    if (performance.memory) {
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
        memoryUsage = `Used: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB <BR/>
            Total: ${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB <BR/>
            Limit: ${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    }
    // update the status box with a snapshot of what's happening
    app.setStatus('Decoding', `
        Stream: ${app.readerIsFinished ? 'finished' : 'reading'}</br>
    FPS: ${app.fps} </br>
    CPU Cores: ${navigator.hardwareConcurrency} </br>
    Queue size: ${videoDecoder.decodeQueueSize}.<br/>
    Decoded frame: ${app.frameNumber} of ${app.frameCount}<br/> ${memoryUsage}
    `)
}

export { resourceUsageReport }