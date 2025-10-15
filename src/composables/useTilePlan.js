import { computed } from 'vue';
import { useAppStore } from '../stores/appStore';

// The tilePlan is initially a computed property
// so as to be able to reactively update the user interface with helpful preview
// information about the tile plan.
// afterwards it gets passed on to the videoProcessor
// so that processing can occur reliably without further mutation.

export function useTilePlan() {
    const app = useAppStore(); // Pinia store

    const tilePlan = computed(() => {
        const plan = {
            length: 0,
            width: 0,
            height: 0,
            tiles: [],
            notices: [],
            isScaled: false,
            scaleFrom: 0,
            scaleTo: 0,
            rotate: 0, // Rotation angle (0 or 90 degrees)
            skipping: 0, // Number of frames being skipped
        };

        // Ensure necessary data is available
        if (
            !app.fileInfo?.width ||
            !app.fileInfo?.height ||
            !app.frameCount ||
            !app.tileProportion
        ) {
            plan.notices.push('Insufficient data to calculate tile plan.');
            return plan;
        }

        // Determine rotation based on samplingMode and outputMode
        if (app.samplingMode !== app.outputMode) {
            plan.rotate = 90;
        }

        // Determine aspect ratio based on tileProportion
        let aspectRatio;
        if (app.tileProportion === 'square') {
            aspectRatio = 1;
        } else if (app.tileProportion === 'landscape') {
            aspectRatio = 16 / 9;
        } else if (app.tileProportion === 'portrait') {
            aspectRatio = 9 / 16;
        } else {
            plan.notices.push('Invalid tile proportion.');
            return plan;
        }

        // Initialize variables
        let framesPerTile; // Number of frames per tile (temporal side)
        let spatialSide = app.samplePixelCount; // Spatial side length (width or height based on samplingMode)
        let maxQualityTiles; // Maximum number of tiles for quality reference

        // Begin processing based on tileMode
        if (app.tileMode === 'tile') {
            // Nested hierarchy: tileMode > samplingMode > outputMode > prioritize
            if (app.samplingMode === 'rows') {
                if (app.outputMode === 'rows') {
                    framesPerTile = Math.floor(spatialSide / aspectRatio);
                    maxQualityTiles = Math.floor(app.frameCount / framesPerTile);
                    // Sampling rows, outputting rows
                    if (app.prioritize === 'quality') {
                        // Prioritize quality
                        plan.isScaled = false;
                        plan.width = spatialSide; // Spatial side
                        plan.height = framesPerTile; // Temporal side  
                        plan.length = maxQualityTiles;
                    } else if (app.prioritize === 'quantity') {
                        // Prioritize quantity 
                        plan.length = maxQualityTiles + 1;
                        // Recalculate framesPerTile
                        framesPerTile = Math.floor(app.frameCount / plan.length);
                        plan.height = framesPerTile; // Temporal side
                        plan.width = Math.floor(plan.height * aspectRatio); // Spatial side 
                        plan.isScaled = true;
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = plan.width;
                    } else if (app.prioritize === 'powersOfTwo') {
                        // Prioritize power-of-two resolution
                        plan.isScaled = true;
                        plan.width = app.potResolution; // Spatial side (POT)
                        plan.height = Math.floor(app.potResolution / aspectRatio); // Temporal side
                        framesPerTile = plan.height;
                        plan.length = Math.floor(app.frameCount / framesPerTile);
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = app.potResolution;
                    }
                } else if (app.outputMode === 'columns') {
                    framesPerTile = Math.floor(spatialSide * aspectRatio);
                    maxQualityTiles = Math.floor(app.frameCount / framesPerTile);

                    // Sampling rows, outputting columns (rotation)
                    if (app.prioritize === 'quality') {
                        // Prioritize quality
                        plan.isScaled = false;
                        plan.height = spatialSide; // Spatial side
                        plan.width = framesPerTile // Temporal side 
                        plan.length = maxQualityTiles;
                    } else if (app.prioritize === 'quantity') {
                        // Prioritize quantity
                        plan.length = maxQualityTiles + 1;
                        // Recalculate framesPerTile
                        framesPerTile = Math.floor(app.frameCount / plan.length);
                        plan.width = framesPerTile; // Temporal side
                        // plan.height = Math.floor(plan.width * aspectRatio); // Spatial side 
                        plan.height = Math.floor(plan.width / aspectRatio); // Spatial side 
                        plan.isScaled = true;
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = plan.height;
                    } else if (app.prioritize === 'powersOfTwo') {
                        // Prioritize power-of-two resolution
                        plan.isScaled = true;
                        plan.height = app.potResolution; // Spatial side (POT)
                        plan.width = Math.floor(app.potResolution * aspectRatio); // Temporal side
                        framesPerTile = plan.width;
                        plan.length = Math.floor(app.frameCount / framesPerTile);
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = app.potResolution;
                    }
                }
            } else if (app.samplingMode === 'columns') {
                if (app.outputMode === 'rows') {
                    // The adjusted aspect ratio did not always work,
                    // in some cases I had to revert back to the original aspect ratio 
                    // in order to get the desired behaviour 
                    framesPerTile = Math.floor(spatialSide / aspectRatio);
                    maxQualityTiles = Math.floor(app.frameCount / framesPerTile);
                    // Sampling columns, outputting rows (rotation)
                    if (app.prioritize === 'quality') {
                        // Prioritize quality
                        plan.isScaled = false;
                        plan.width = spatialSide; // Spatial side
                        plan.height = framesPerTile // Temporal side 
                        plan.length = maxQualityTiles;
                    } else if (app.prioritize === 'quantity') {
                        // Prioritize quantity
                        plan.length = maxQualityTiles + 1;
                        // Recalculate framesPerTile
                        framesPerTile = Math.floor(app.frameCount / plan.length);
                        plan.height = framesPerTile; // Temporal side
                        plan.width = Math.floor(plan.height * aspectRatio); // Spatial side   
                        plan.isScaled = true;
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = plan.width;
                    } else if (app.prioritize === 'powersOfTwo') {
                        // Prioritize power-of-two resolution
                        plan.isScaled = true;
                        plan.width = app.potResolution; // Spatial side (POT)
                        plan.height = Math.floor(app.potResolution / aspectRatio); // Temporal side
                        framesPerTile = plan.height;
                        plan.length = Math.floor(app.frameCount / framesPerTile);
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = app.potResolution;
                    }
                } else if (app.outputMode === 'columns') {
                    framesPerTile = Math.floor(spatialSide * aspectRatio);
                    maxQualityTiles = Math.floor(app.frameCount / framesPerTile);
                    // Sampling columns, outputting columns
                    if (app.prioritize === 'quality') {
                        // Prioritize quality
                        plan.isScaled = false;
                        plan.height = spatialSide; // Spatial side
                        plan.width = framesPerTile; // Temporal side  
                        plan.length = maxQualityTiles;
                    } else if (app.prioritize === 'quantity') {
                        // Prioritize quantity
                        plan.length = maxQualityTiles + 1;
                        // Recalculate framesPerTile
                        framesPerTile = Math.floor(app.frameCount / plan.length);
                        plan.width = framesPerTile; // Temporal side
                        plan.height = Math.floor(plan.width / aspectRatio); // Spatial side 
                        plan.isScaled = true;
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = plan.height;
                    } else if (app.prioritize === 'powersOfTwo') {
                        // Prioritize power-of-two resolution
                        plan.isScaled = true;
                        plan.height = app.potResolution; // Spatial side (POT)
                        plan.width = Math.floor(app.potResolution * aspectRatio); // Temporal side
                        framesPerTile = plan.width;
                        plan.length = Math.floor(app.frameCount / framesPerTile);
                        plan.scaleFrom = spatialSide;
                        plan.scaleTo = app.potResolution;
                    }
                }
            }

            // Generate tile frame ranges
            plan.tiles = Array.from({ length: plan.length }, (_, i) => {
                const startFrame = i * framesPerTile + 1;
                const endFrame = (i + 1) * framesPerTile;
                return {
                    start: startFrame,
                    end: endFrame,
                };
            });

            // Handle common calculations after nesting
            if (plan.isScaled) {
                // Ensure framesPerTile and plan.length are valid
                if (framesPerTile < 1 || plan.length < 1) {
                    const framesNeeded = framesPerTile || 1;
                    const framesShort = framesNeeded - app.frameCount;
                    plan.notices.push(
                        `Not enough frames to create tiles with the current settings. Each tile requires ${framesNeeded} frames, but only ${app.frameCount} frames are available. You are short by ${framesShort} frames.`
                    );
                    plan.skipping = app.frameCount; // All frames are skipped
                    return plan;
                }

                // All frames are used
                plan.skipping = 0;
            } else {

                if (framesPerTile < 1 || plan.length < 1) {
                    const framesNeeded = framesPerTile || 1;
                    const framesShort = framesNeeded - app.frameCount;
                    plan.notices.push(
                        `Not enough frames to create a single tile with the current settings. Each tile requires ${framesNeeded} frames, but only ${app.frameCount} frames are available. You are short by ${framesShort} frames.`
                    );
                    plan.skipping = app.frameCount; // All frames are skipped
                    return plan;
                }

                // Calculate skipped frames
                const usedFrames = plan.length * framesPerTile;
                plan.skipping = app.frameCount - usedFrames;
            }
        } else if (app.tileMode === 'full') {
            // Full tile mode: one tile covering all frames
            plan.length = 1;
            plan.isScaled = false;
            plan.scaleFrom = spatialSide;
            plan.scaleTo = spatialSide;
            plan.tiles = [{ start: 1, end: app.frameCount }];
            plan.skipping = 0;

            // Determine tile dimensions based on samplingMode and outputMode
            if (app.samplingMode === 'rows') {
                if (app.outputMode === 'rows') {
                    plan.width = spatialSide; // Spatial side
                    plan.height = app.frameCount; // Temporal side
                } else if (app.outputMode === 'columns') {
                    plan.height = spatialSide; // Spatial side
                    plan.width = app.frameCount; // Temporal side
                }
            } else if (app.samplingMode === 'columns') {
                if (app.outputMode === 'rows') {
                    plan.width = spatialSide; // Spatial side
                    plan.height = app.frameCount; // Temporal side
                } else if (app.outputMode === 'columns') {
                    plan.height = spatialSide; // Spatial side
                    plan.width = app.frameCount; // Temporal side
                }
            }
        } else {
            plan.notices.push('Invalid tile mode.');
            return plan;
        }

        // Ensure dimensions are integers
        plan.width = Math.floor(plan.width);
        plan.height = Math.floor(plan.height);
        plan.scaleTo = Math.floor(plan.scaleTo);

        return plan;
    });

    return {
        tilePlan,
    };
}
