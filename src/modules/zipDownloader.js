import JSZip from 'jszip';

/**
 * Download all tiles as a ZIP file
 * @param {Object} blobURLs - Map of tile numbers to blob URLs
 * @param {Object} fileInfo - File metadata
 * @param {Object} format - Format descriptor { mime, extension }
 */
export async function downloadAllAsZip(blobURLs, fileInfo, format) {
    const zip = new JSZip();
    const filename = fileInfo?.name?.replace(/\.[^/.]+$/, '') || 'video';

    // Add each blob to the zip
    for (const [tileNumber, blobUrl] of Object.entries(blobURLs)) {
        try {
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            zip.file(
                `${filename}_tile_${tileNumber}.${format.extension}`,
                blob,
                { binary: true }
            );
        } catch (error) {
            console.error(`Failed to add tile ${tileNumber} to ZIP:`, error);
            throw error;
        }
    }

    // Generate ZIP with compression (may be slow for large files)
    const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 } // Balance between speed and size
    });

    // Trigger download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_tiles.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
