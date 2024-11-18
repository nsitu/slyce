import { computed } from 'vue'
import { useAppStore } from '../stores/appStore';


export function useTilePlan() {

    const app = useAppStore()  // Pinia store






    const tilePlan = computed(() => {
        const plan = {
            length: 0, // "length" refers be the number of tiles
            width: 0,
            height: 0,
            tiles: [],  // array of objects with start and end frame numbers
            notices: [], // UI messages
            isScaled: false,
            scaleFrom: 0,
            scaleTo: 0,
            rotate: 0
        }

        if (app.fileInfo?.width && app.fileInfo?.height && app.frameCount && app.tileProportion) {

            // if the outputMode is different from the samplingMode
            // the tiles will be rotated 90 degrees 
            // regardless of other settings
            if (app.samplingMode !== app.outputMode) {
                plan.rotate = 90
            }

            // in tile mode, the tiles are arranged in a grid
            // the dimensions of the tiles are constrained by various settings
            if (app.tileMode === 'tile') {
                if (app.tileProportion === 'square') {
                    if (app.prioritize === 'quantity') {
                        if (app.samplingMode === 'rows') {
                            plan.length = Math.floor(app.frameCount / app.fileInfo.width) + 1
                            plan.height = plan.width = Math.floor(app.frameCount / plan.length)
                            plan.isScaled = true;
                            plan.scaleFrom = app.fileInfo.width
                            plan.scaleTo = plan.width
                            if (app.outputMode === 'rows') {
                                // Action for: tile, square, quantity, rows, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, square, quantity, rows, columns
                            }
                        } else if (app.samplingMode === 'columns') {
                            plan.length = Math.floor(app.frameCount / app.fileInfo.height) + 1
                            plan.height = plan.width = Math.floor(app.frameCount / plan.length)
                            plan.isScaled = true;
                            plan.scaleFrom = app.fileInfo.height
                            plan.scaleTo = plan.height
                            if (app.outputMode === 'rows') {
                                // Action for: tile, square, quantity, columns, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, square, quantity, columns, columns
                            }
                        }
                    } else if (app.prioritize === 'quality') {
                        if (app.samplingMode === 'rows') {
                            plan.height = plan.width = app.fileInfo.width
                            plan.length = Math.floor(app.frameCount / app.fileInfo.width)
                            plan.skipping = app.frameCount % plan.width
                            if (app.outputMode === 'rows') {
                                // Action for: tile, square, quality, rows, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, square, quality, rows, columns
                            }
                        } else if (app.samplingMode === 'columns') {
                            plan.height = plan.width = app.fileInfo.height
                            plan.length = Math.floor(app.frameCount / app.fileInfo.height)
                            plan.skipping = app.frameCount % plan.height
                            if (app.outputMode === 'rows') {
                                // Action for: tile, square, quality, columns, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, square, quality, columns, columns
                            }
                        }
                    }
                    // in the case of a square, the width and height are the same
                    // so width is a stand-in for either side length of the square
                    // NOTE: Array.from(plan) is based on plan.length
                    plan.tiles = Array.from(plan).map((tile, i) => {
                        return { start: i * plan.width + 1, end: (i + 1) * plan.width }
                    })

                } else if (app.tileProportion === 'landscape') {
                    if (app.prioritize === 'quantity') {
                        if (app.samplingMode === 'rows') {
                            if (app.outputMode === 'rows') {
                                // Action for: tile, landscape, quantity, rows, rows
                                plan.length = Math.floor(app.frameCount / app.fileInfo.height) + 1
                                plan.height = Math.floor(app.frameCount / plan.length)
                                plan.width = Math.floor(plan.height * 16 / 9)
                                plan.tiles = Array.from(plan).map((tile, i) => {
                                    return { start: i * plan.height + 1, end: (i + 1) * plan.height }
                                })
                                plan.isScaled = true;
                                plan.scaleFrom = app.fileInfo.width
                                plan.scaleTo = plan.width
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, landscape, quantity, rows, columns
                                plan.length = Math.floor(app.frameCount / app.fileInfo.height) + 1
                                plan.height = Math.floor(app.frameCount / plan.length)
                                plan.width = Math.floor(plan.height * 16 / 9)
                                plan.tiles = Array.from(plan).map((tile, i) => {
                                    return { start: i * plan.height + 1, end: (i + 1) * plan.height }
                                })
                                plan.isScaled = true;
                                plan.scaleFrom = app.fileInfo.width
                                plan.scaleTo = plan.width
                            }
                        } else if (app.samplingMode === 'columns') {
                            if (app.outputMode === 'rows') {
                                // Action for: tile, landscape, quantity, columns, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, landscape, quantity, columns, columns
                            }
                        }
                    } else if (app.prioritize === 'quality') {
                        if (app.samplingMode === 'rows') {
                            if (app.outputMode === 'rows') {
                                plan.width = app.fileInfo.width
                                plan.height = Math.floor(app.fileInfo.width * 9 / 16)
                                plan.length = Math.floor(app.frameCount / plan.height)
                                plan.skipping = app.frameCount % plan.height
                                plan.tiles = Array.from(plan).map((tile, i) => {
                                    return { start: i * plan.height + 1, end: (i + 1) * plan.height }
                                })
                                // Action for: tile, landscape, quality, rows, rows
                            } else if (app.outputMode === 'columns') {
                                plan.width = app.fileInfo.width
                                plan.height = Math.floor(app.fileInfo.width * 9 / 16)
                                plan.length = Math.floor(app.frameCount / plan.width)
                                plan.skipping = app.frameCount % plan.width
                                plan.tiles = Array.from(plan).map((tile, i) => {
                                    return { start: i * plan.width + 1, end: (i + 1) * plan.width }
                                })
                                // Action for: tile, landscape, quality, rows, columns
                            }
                        } else if (app.samplingMode === 'columns') {
                            plan.width = app.fileInfo.height
                            plan.height = Math.floor(app.fileInfo.height * 9 / 16)
                            plan.length = Math.floor(app.frameCount / plan.height)
                            plan.skipping = app.frameCount % plan.height
                            plan.tiles = Array.from(plan).map((tile, i) => {
                                return { start: i * plan.height + 1, end: (i + 1) * plan.height }
                            })
                            if (app.outputMode === 'rows') {
                                // Action for: tile, landscape, quality, columns, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, landscape, quality, columns, columns
                            }
                        }
                    }
                } else if (app.tileProportion === 'portrait') {
                    if (app.prioritize === 'quantity') {
                        if (app.samplingMode === 'rows') {
                            if (app.outputMode === 'rows') {
                                // Action for: tile, portrait, quantity, rows, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, portrait, quantity, rows, columns
                            }
                        } else if (app.samplingMode === 'columns') {
                            if (app.outputMode === 'rows') {
                                // Action for: tile, portrait, quantity, columns, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, portrait, quantity, columns, columns
                            }
                        }
                    } else if (app.prioritize === 'quality') {
                        if (app.samplingMode === 'rows') {
                            if (app.outputMode === 'rows') {
                                // Action for: tile, portrait, quality, rows, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, portrait, quality, rows, columns
                            }
                        } else if (app.samplingMode === 'columns') {
                            if (app.outputMode === 'rows') {
                                // Action for: tile, portrait, quality, columns, rows
                            } else if (app.outputMode === 'columns') {
                                // Action for: tile, portrait, quality, columns, columns
                            }
                        }
                    }
                }
            } else if (app.tileMode === 'full') {
                // in this case there is only one full size tile
                plan.tiles = [{ start: 1, end: app.frameCount }]
                plan.length = 1
                if (app.samplingMode === 'rows') {
                    if (app.outputMode === 'rows') {
                        // Action for: full, rows, rows 
                        plan.width = app.samplePixelCount
                        plan.height = app.frameCount
                    } else if (app.outputMode === 'columns') {
                        // Action for: full, rows, columns 
                        plan.width = app.frameCount
                        plan.height = app.samplePixelCount
                    }
                } else if (app.samplingMode === 'columns') {
                    if (app.outputMode === 'rows') {
                        // Action for: full, columns, rows 
                        plan.width = app.samplePixelCount
                        plan.height = app.frameCount
                    } else if (app.outputMode === 'columns') {
                        // Action for: full, columns, columns
                        plan.width = app.frameCount
                        plan.height = app.samplePixelCount
                    }
                }
            }
        }
        return plan
    })

    return {
        tilePlan
    }
}


