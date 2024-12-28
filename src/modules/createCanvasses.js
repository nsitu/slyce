// create a set of canvasses for one tile
export function createCanvasses(settings) {

    let { tilePlan, crossSectionCount, samplingMode } = settings;
    let canvasses = [];

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
