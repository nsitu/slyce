// fileHandler.mjs
let fpsNow = 0;
let lastFPSUpdate = 0;
let timestamps = [];

const fps = () => {
    const now = performance.now()
    timestamps.push(now)
    // track up to 150 recent frames
    if (timestamps.length > 150) timestamps.shift();
    // only report every 250ms
    if (now - lastFPSUpdate > 250) {
        lastFPSUpdate = now;
        if (timestamps.length > 1) {
            const timeSpan = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
            fpsNow = (timestamps.length - 1) / timeSpan;
        }
    }
    return parseInt(fpsNow);
}

export { fps };
