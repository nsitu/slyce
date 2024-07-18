// getMediaInfo.mjs 
// use mediaInfo.js to discover the metadata for a video file
// e.g. framecount and duration 
import MediaInfoFactory from 'mediainfo.js'

// Function to handle file analysis
async function getMediaInfo(file) {
    let mediainfo = await MediaInfoFactory();
    console.log('MediaInfo.js ready:', mediainfo);
    const getSize = () => file.size;
    const readChunk = (chunkSize, offset) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target.error) reject(event.target.error);
                resolve(new Uint8Array(event.target.result));
            };
            reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
        });
    try {
        let result = await mediainfo.analyzeData(getSize, readChunk)
        const metaData = result?.media?.track.find(t => t['@type'] === 'Video')
        console.log('MediaInfo data:', metaData);
        return metaData
    }
    catch (error) {
        console.error('Error analyzing file with MediaInfo.js:', error);
    }
}

export { getMediaInfo }
