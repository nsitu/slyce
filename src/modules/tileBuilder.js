// tileBuilder.js
import { EventEmitter } from 'events';  // https://www.npmjs.com/package/events

export class TileBuilder extends EventEmitter {
    constructor(settings) {
        super();
        this.settings = settings
        this.canvasses = this.createCanvasses();
    }

    createCanvasses() {
        let canvasses = [];
        let { tilePlan, crossSectionCount, samplingMode } = this.settings;

        for (let i = 0; i < crossSectionCount; i++) {
            let canvas = new OffscreenCanvas(tilePlan.width, tilePlan.height);
            let ctx = canvas.getContext('2d');
            if (tilePlan.rotate !== 0) {
                // Translate to Center, 
                // Rotate by 90 degrees clockwise (or counterclockwise)
                // to achieve mapping of top-to-bottom ⇔ left-to-right
                // Translate back to the corner (respecting orientation swap)
                ctx.translate(tilePlan.width / 2, tilePlan.height / 2);
                if (samplingMode === 'rows') ctx.rotate(tilePlan.rotate * Math.PI / 180);
                if (samplingMode === 'columns') ctx.rotate(-tilePlan.rotate * Math.PI / 180);
                ctx.translate(-tilePlan.height / 2, -tilePlan.width / 2);
            }
            canvasses = canvasses || [];
            canvasses.push(canvas);
        }

        return canvasses;
    }


    processFrame(data) {

        const {
            videoFrame,
            frameNumber
        } = data

        const {
            fileInfo,
            tileNumber,
            tilePlan,
            samplingMode,
            outputMode,
            crossSectionCount
        } = this.settings


        // Let's normalize the frameNumber to the tile's range
        // so we know where to draw the sample in the destination tile  
        let drawLocation = frameNumber - tilePlan.tiles[tileNumber].start;
        // NOTE: ↓ Later we also have a sampleLocation  (unique to each canvas)


        this.canvasses.forEach((canvas, canvasNumber) => {

            // We will sample pixels from a different y-location for each canvas    
            // Cosine distribution  (This creates a gentle sway back and forth)
            // TODO: audit this Math to make sure it uses the full range properly
            // A normalized index describes the canvas number as a fraction of the total canvasses
            // (A number between 0 and 1). We multiply this by PI to get a number between 0 and PI
            // This is a useful range for cosine functions.
            let normalizedIndex = (canvasNumber / (crossSectionCount - 1)) * Math.PI;
            // if we are sampling rows, they are distributed along the video height
            // if we are sampling columns, they are distributed along the video width
            let distributionRange = 0
            if (samplingMode === 'rows') distributionRange = fileInfo.height;
            if (samplingMode === 'columns') distributionRange = fileInfo.width;
            let sampleLocation = (Math.cos(normalizedIndex) + 1) / 2 * (distributionRange - 1);


            let ctx = canvas.getContext('2d')


            // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            // When sample and tile dimensions differ, drawImage ⟹ scaling effects

            if (samplingMode === 'columns') {
                if (outputMode === 'columns') {
                    const sx = sampleLocation           // Source x
                    const sy = 0                        // Source y
                    const sw = 1                        // Source width
                    const sh = fileInfo.height      // Source height
                    const dx = drawLocation             // Destination x
                    const dy = 0                        // Destination y
                    const dw = 1                        // Destination width
                    const dh = tilePlan.height          // Destination height
                    ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
                }
                else if (outputMode === 'rows') {
                    // We have already rotated the canvas
                    // to account for samplingMode != outputMode
                    // the lets us write columns to rows
                    // NOTE: we still need to use tilePlan.width for the height
                    // since the canvas is rotated.
                    const sx = sampleLocation           // Source x
                    const sy = 0                        // Source y
                    const sw = 1                        // Source width
                    const sh = fileInfo.height      // Source height
                    const dx = drawLocation             // Destination x
                    const dy = 0                        // Destination y
                    const dw = 1                        // Destination width
                    const dh = tilePlan.width           // ***Destination height
                    ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
                }
            }
            else if (samplingMode === 'rows') {
                if (outputMode === 'rows') {
                    const sx = 0                        // Source x
                    const sy = sampleLocation           // Source y
                    const sw = fileInfo.width       // Source width
                    const sh = 1                        // Source height
                    const dx = 0                        // Destination x
                    const dy = drawLocation             // Destination y
                    const dw = tilePlan.width           // Destination width
                    const dh = 1                        // Destination height
                    ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
                }
                else if (outputMode === 'columns') {
                    // We have already rotated the canvas
                    // to account for samplingMode != outputMode
                    // the lets us write rows to columns
                    // NOTE: we still need to use tilePlan.height for the height
                    // since the canvas is rotated.
                    const sx = 0                        // Source x
                    const sy = sampleLocation           // Source y
                    const sw = fileInfo.width       // Source width
                    const sh = 1                        // Source height
                    const dx = 0                        // Destination x
                    const dy = drawLocation             // Destination y
                    const dw = tilePlan.height          // Destination width
                    const dh = 1                        // Destination height
                    ctx.drawImage(videoFrame, sx, sy, sw, sh, dx, dy, dw, dh);
                }
            }
        })
        // TODO: make sure all the drawImage calls are finished before closing the videoFrame


        // Check if this is the last frame of the tile
        if (frameNumber === tilePlan.tiles[tileNumber].end) {
            //createImageBitmap(canvas).then(imageBitmap => {  
            let images = this.canvasses.map(canvas => canvas.transferToImageBitmap());
            // we are done with this tile, so emit an event
            this.emit('complete', images);
            //  “destroy” these canvasses
            delete this.canvasses

        }

    }


}
