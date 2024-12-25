import { useAppStore } from '../stores/appStore';


// Given a video frame, and a frame number
// extract samples from the frame
// as per the tileplan
// and write each sample to the correct canvas
// also as per the tile plan.

// if canvasses don't exist yet for the tile in question
// rely on the canvas pool to provide canvasses

// if a tile is finished, the encode process needs to start
// to assemble all  canvasses into an animation. 
// then clear the canvasses and re-use them for the next tile.
// or else delete the canvasses and make new ones.

const processFrame = (videoFrame, frameNumber, tileNumber) => {


    const app = useAppStore()  // Pinia store  


    // Let's normalize the frameNumber to the tile's range
    // so we know where to draw the sample in the destination tile  
    let drawLocation = frameNumber - app.tilePlan.tiles[tileNumber].start;
    // NOTE: ↓ Later we also have a sampleLocation  (unique to each canvas)

    // if we don't have canvasses for this tile yet, 
    // allocate them from the pool, and set the orientation
    if (app.canvasses[tileNumber] == undefined) {
        for (let i = 0; i < app.crossSectionCount; i++) {
            let canvas = app.canvasPool.getCanvas()
            let ctx = canvas.getContext('2d');
            if (app.tilePlan.rotate !== 0) {
                // Translate to Center, 
                // Rotate by 90 degrees clockwise (or counterclockwise)
                // to achieve mapping of top-to-bottom ⇔ left-to-right
                // Translate back to the corner (respecting orientation swap)
                ctx.translate(app.tilePlan.width / 2, app.tilePlan.height / 2);
                if (app.samplingMode === 'rows') ctx.rotate(app.tilePlan.rotate * Math.PI / 180);
                if (app.samplingMode === 'columns') ctx.rotate(-app.tilePlan.rotate * Math.PI / 180);
                ctx.translate(-app.tilePlan.height / 2, -app.tilePlan.width / 2);
            }
            app.allocateCanvas(tileNumber, canvas);
        }
    }

    // we can be confident that the canvasses exist now
    // and are correctly oriented.

    app.canvasses[tileNumber].forEach((canvas, canvasNumber) => {

        // We will sample pixels from a different y-location for each canvas    
        // Cosine distribution  (This creates a gentle sway back and forth)
        // TODO: audit this Math to make sure it uses the full range properly
        // A normalized index describes the canvas number as a fraction of the total canvasses
        // (A number between 0 and 1). We multiply this by PI to get a number between 0 and PI
        // This is a useful range for cosine functions.
        let normalizedIndex = (canvasNumber / (app.crossSectionCount - 1)) * Math.PI;
        // if we are sampling rows, they are distributed along the video height
        // if we are sampling columns, they are distributed along the video width
        let distributionRange = 0
        if (app.samplingMode === 'rows') distributionRange = app.fileInfo.height;
        if (app.samplingMode === 'columns') distributionRange = app.fileInfo.width;
        let sampleLocation = (Math.cos(normalizedIndex) + 1) / 2 * (distributionRange - 1);


        let ctx = canvas.getContext('2d')


        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        // When sample and tile dimensions differ, drawImage ⟹ scaling effects

        if (app.samplingMode === 'columns') {
            if (app.outputMode === 'columns') {
                const sx = sampleLocation           // Source x
                const sy = 0                        // Source y
                const sw = 1                        // Source width
                const sh = app.fileInfo.height      // Source height
                const dx = drawLocation             // Destination x
                const dy = 0                        // Destination y
                const dw = 1                        // Destination width
                const dh = app.tilePlan.height          // Destination height
                ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
            }
            else if (app.outputMode === 'rows') {
                // We have already rotated the canvas
                // to account for samplingMode != outputMode
                // the lets us write columns to rows
                // NOTE: we still need to use app.tilePlan.width for the height
                // since the canvas is rotated.
                const sx = sampleLocation           // Source x
                const sy = 0                        // Source y
                const sw = 1                        // Source width
                const sh = app.fileInfo.height      // Source height
                const dx = drawLocation             // Destination x
                const dy = 0                        // Destination y
                const dw = 1                        // Destination width
                const dh = app.tilePlan.width           // ***Destination height
                ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
            }
        }
        else if (app.samplingMode === 'rows') {
            if (app.outputMode === 'rows') {
                const sx = 0                        // Source x
                const sy = sampleLocation           // Source y
                const sw = app.fileInfo.width       // Source width
                const sh = 1                        // Source height
                const dx = 0                        // Destination x
                const dy = drawLocation             // Destination y
                const dw = app.tilePlan.width           // Destination width
                const dh = 1                        // Destination height
                ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
            }
            else if (app.outputMode === 'columns') {
                // We have already rotated the canvas
                // to account for samplingMode != outputMode
                // the lets us write rows to columns
                // NOTE: we still need to use app.tilePlan.height for the height
                // since the canvas is rotated.
                const sx = 0                        // Source x
                const sy = sampleLocation           // Source y
                const sw = app.fileInfo.width       // Source width
                const sh = 1                        // Source height
                const dx = 0                        // Destination x
                const dy = drawLocation             // Destination y
                const dw = app.tilePlan.height          // Destination width
                const dh = 1                        // Destination height
                ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
            }
        }
    })
    // TODO: make sure all the drawImage calls are finished before closing the videoFrame

    videoFrame.close();



    // return ?
}

export { processFrame }