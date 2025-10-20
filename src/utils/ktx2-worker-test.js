/**
 * Test if KTX2 encoding works in Web Worker context
 * This tests whether the Basis encoder WASM module can be loaded,
 * initialized, and used for encoding inside a Web Worker,
 * and whether multithreading works in that context.
 */
export async function testKTX2Worker() {
    console.log('=== Testing KTX2 Encoding in Web Worker ===');

    // Create a small test image (64x64 red square)
    const width = 64;
    const height = 64;
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < rgba.length; i += 4) {
        rgba[i] = 255;     // R
        rgba[i + 1] = 0;   // G
        rgba[i + 2] = 0;   // B
        rgba[i + 3] = 255; // A
    }

    return new Promise((resolve, reject) => {
        const worker = new Worker(
            new URL('../workers/ktx2EncoderTest.js', import.meta.url),
            { type: 'module' }
        );

        const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error('Test timed out after 10 seconds'));
        }, 10000);

        worker.onmessage = (e) => {
            clearTimeout(timeout);
            const { type, data, error, stack } = e.data;

            if (type === 'TEST_SUCCESS') {
                console.log('✅ KTX2 Worker Test PASSED');
                console.log(`   Encoding time: ${data.elapsed.toFixed(1)}ms`);
                console.log(`   Output size: ${(data.size / 1024).toFixed(1)}KB`);
                console.log(`   Threading: ${data.threadingSupported ? `${data.threadCount} threads` : 'single-threaded'}`);
                worker.terminate();
                resolve(data);
            } else if (type === 'TEST_ERROR') {
                console.error('❌ KTX2 Worker Test FAILED');
                console.error(`   Error: ${error}`);
                if (stack) console.error(stack);
                worker.terminate();
                reject(new Error(error));
            }
        };

        worker.onerror = (error) => {
            clearTimeout(timeout);
            console.error('❌ Worker error:', error);
            worker.terminate();
            reject(error);
        };

        // Send test data (transfer the RGBA buffer for efficiency)
        worker.postMessage({
            type: 'TEST_ENCODE',
            rgba,
            width,
            height
        }, [rgba.buffer]);
    });
}
