// getTrackInfo.mjs
// Use MP4Box to get information about a media file. 

import MP4Box from 'mp4box';

const getTrackInfo = (file) => {
    return new Promise((resolve, reject) => {
        const CHUNK_SIZE = 1024 * 1024; // 1MB chunk sizes
        let offset = 0;
        let continueLoading = true; // Flag to control further data loading

        const mp4boxFile = MP4Box.createFile();
        mp4boxFile.onError = function (e) {
            console.error('Error while parsing the file:', e);
            reject(e); // Reject the promise on error
        };

        mp4boxFile.onReady = function (info) {
            const videoTrack = info.tracks.find(track => track.type === 'video');
            if (videoTrack) {
                continueLoading = false; // Stop loading further data
                resolve(videoTrack); // Resolve promise with videoTrack
            }
        };

        function readNextChunk() {
            if (!continueLoading) {
                mp4boxFile.flush(); // Ensure all buffers are processed
                return; // Exit the function to stop loading more chunks
            }

            const reader = new FileReader();
            const blob = file.slice(offset, offset + CHUNK_SIZE);

            reader.onload = function (e) {
                let arrayBuffer = e.target.result;
                arrayBuffer.fileStart = offset; // Ensure fileStart is set on the ArrayBuffer
                mp4boxFile.appendBuffer(arrayBuffer);
                // ISOBMFF and QTFF specifications define the metadata differently
                // Google Pixel videos use QuickTime Atom format for metadata. 
                // but it's not supported by MP4Box
                // [BoxParser] Box has a size greater than its container size 
                // https://github.com/gpac/mp4box.js/issues/309
                console.log(`Loaded chunk from offset ${offset}, size ${arrayBuffer.byteLength} bytes.`);

                offset += arrayBuffer.byteLength;

                if (offset < file.size) {
                    // Most of the time MP4Box will parse the 
                    // metadata from the first chunk. But just in case:
                    // if the metadata exceeds the chunk size, we 
                    // will read chunks until mp4box is ready.
                    readNextChunk();
                } else {
                    mp4boxFile.flush();
                }
            };

            reader.onerror = function (e) {
                console.error('Error reading file:', e);
                reject(e); // Reject the promise on read error
            };

            reader.readAsArrayBuffer(blob);
        }
        readNextChunk();
    });
};

export { getTrackInfo };
