import { useAppStore } from '../stores/appStore';
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
    const effectiveFrameCount = app.framesToSample > 0 ? Math.min(app.framesToSample, app.frameCount) : app.frameCount;
    app.setStatus('Decoding', `
        Stream: ${app.readerIsFinished ? 'finished' : 'reading'}</br>
    FPS: ${app.fps} </br>
    CPU Cores: ${navigator.hardwareConcurrency} </br>
    Queue size: ${null}.<br/>
    Decoded frame: ${app.frameNumber} of ${effectiveFrameCount}<br/> ${memoryUsage}
    `)
}

export { resourceUsageReport }