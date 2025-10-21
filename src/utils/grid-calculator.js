/**
 * Grid Calculator Utility
 * Calculates optimal grid dimensions for tile layouts
 */

/**
 * Calculate optimal grid dimensions for tile layout
 * @param {number} tileCount - Number of tiles to arrange
 * @param {string} flowDirection - 'horizontal' (left-to-right) or 'vertical' (top-to-bottom)
 * @returns {{ cols: number, rows: number }}
 */
export function calculateOptimalGrid(tileCount, flowDirection = 'horizontal') {
    // Special cases
    if (tileCount === 0) return { cols: 0, rows: 0 };
    if (tileCount === 1) return { cols: 1, rows: 1 };

    // Find approximate square root to establish search range
    const sqrt = Math.sqrt(tileCount);
    const minDim = Math.max(1, Math.floor(sqrt) - 1);
    const maxDim = Math.ceil(sqrt) + 2;

    let bestGrid = null;
    let bestScore = -Infinity;

    // Try all reasonable combinations
    for (let cols = minDim; cols <= maxDim; cols++) {
        const rows = Math.ceil(tileCount / cols);
        const capacity = cols * rows;
        const stragglers = capacity - tileCount;
        const balance = Math.abs(cols - rows);
        const efficiency = tileCount / capacity;

        // Scoring function (weights can be tuned)
        const score = (
            efficiency * 100 +           // Maximize efficiency (0-100 range)
            -stragglers * 10 +            // Penalize stragglers heavily
            -balance * 5 +                // Penalize imbalance moderately
            -Math.abs(cols - 4) * 2       // Slight preference for ~4 cols (good for most screens)
        );

        if (score > bestScore) {
            bestScore = score;
            bestGrid = { cols, rows };
        }
    }

    console.log(`[grid-calculator] Optimal grid for ${tileCount} tiles (${flowDirection}):`, bestGrid, `score: ${bestScore.toFixed(2)}`);

    return bestGrid;
}

/**
 * Calculate positions for tiles in a grid
 * @param {number} tileCount - Number of tiles to position
 * @param {string} flowDirection - 'horizontal' or 'vertical'
 * @param {{ width: number, height: number }} tileSize - Size of each tile
 * @param {number} spacing - Spacing between tiles
 * @returns {{ positions: Array<{x: number, y: number}>, cols: number, rows: number }}
 */
export function calculateGridPositions(tileCount, flowDirection, tileSize, spacing = 0) {
    const { cols, rows } = calculateOptimalGrid(tileCount, flowDirection);
    const positions = [];

    // Calculate cell dimensions (tile size + spacing between tiles)
    const cellWidth = tileSize.width + spacing;
    const cellHeight = tileSize.height + spacing;

    if (flowDirection === 'horizontal') {
        // Left-to-right, then top-to-bottom (columns mode)
        for (let i = 0; i < tileCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            // Center the grid around origin (0, 0)
            // Subtract half the grid width/height to center it
            positions.push({
                x: col * cellWidth - (cols - 1) * cellWidth / 2,
                y: (rows - 1) * cellHeight / 2 - row * cellHeight
            });
        }
    } else {
        // Top-to-bottom, then left-to-right (rows mode)
        for (let i = 0; i < tileCount; i++) {
            const col = Math.floor(i / rows);
            const row = i % rows;

            // Center the grid around origin (0, 0)
            positions.push({
                x: col * cellWidth - (cols - 1) * cellWidth / 2,
                y: (rows - 1) * cellHeight / 2 - row * cellHeight
            });
        }
    }

    return { positions, cols, rows };
}
