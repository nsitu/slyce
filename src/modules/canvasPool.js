// TODO: account for cases where dimensions are odd numbers
// by adjusting them to ensure even number of pixels
// One Possibility: if (dimension % 2 !== 0) { dimension--; }

export function createCanvasPool(size, width, height) {
    const pool = [];

    // Pre-create canvases
    for (let i = 0; i < size; i++) {
        pool.push(createCanvas(width, height));
    }

    // Create a new canvas
    function createCanvas(width, height) {
        let canvas = new OffscreenCanvas(width, height);
        return canvas;
    }

    // Retrieve a canvas from the pool
    function getCanvas() {
        if (pool.length > 0) {
            return pool.pop();
        } else {
            console.warn("Canvas pool exhausted! Creating a new canvas.");
            return createCanvas(width, height); // Create a new one if pool is empty
        }
    }

    // Return a canvas to the pool
    function releaseCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pool.push(canvas); // Add the canvas back to the pool
    }


    // TODO / NOTE: I wonder if we can track the canvases that are in use
    // so as to be able to centrally release them all at once
    // e.g. when we are done with a tile.
    // This might be an antipattern though; look into it


    // Expose public API
    return {
        getCanvas,
        releaseCanvas,
    };
}
