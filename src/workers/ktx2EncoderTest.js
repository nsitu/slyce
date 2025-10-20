import { threadingSupported, optimalThreadCount } from '../utils/wasm-utils.js';

// We can't use getBasisModule() in a worker because it relies on the main thread's module
// Instead, we need to load BASIS directly in the worker context

let basisModule = null;

async function loadBasisInWorker() {
    if (basisModule) {
        return basisModule;
    }

    console.log('[KTX2 Worker Test] Loading BASIS module in worker context...');

    // Module workers can't use importScripts(), so we fetch and eval instead
    // NOTE: For now, always use non-threaded version in worker
    // The threaded version tries to spawn its own workers which creates nested worker issues
    const scriptPath = '/wasm/basis_encoder.js';
    console.log(`[KTX2 Worker Test] Fetching ${scriptPath} (non-threaded version for worker compatibility)...`);

    try {
        // Fetch the script as text
        const response = await fetch(scriptPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${scriptPath}: ${response.statusText}`);
        }

        const scriptText = await response.text();
        console.log(`[KTX2 Worker Test] Script fetched (${scriptText.length} bytes), evaluating...`);

        // Evaluate the script in global scope
        // This adds the BASIS() function to the global scope
        (0, eval)(scriptText);

        if (typeof BASIS === 'undefined') {
            throw new Error('BASIS not defined after eval');
        }

        console.log('[KTX2 Worker Test] BASIS script loaded, initializing module...');

        // Initialize the module
        const moduleConfig = {
            // Tell BASIS where to find its WASM file
            locateFile: (path, scriptDirectory) => {
                console.log('[KTX2 Worker Test] locateFile called:', path, scriptDirectory);
                // The WASM files are in /wasm/ directory
                if (path.endsWith('.wasm')) {
                    return `/wasm/${path}`;
                }
                return scriptDirectory + path;
            },
            onRuntimeInitialized: () => {
                console.log('[KTX2 Worker Test] BASIS runtime initialized');
            },
            onAbort: (what) => {
                console.error('[KTX2 Worker Test] BASIS aborted:', what);
            }
        };

        const module = await BASIS(moduleConfig);

        if (!module.initializeBasis) {
            throw new Error('initializeBasis not available');
        }

        console.log('[KTX2 Worker Test] Calling initializeBasis()...');
        module.initializeBasis();
        console.log('[KTX2 Worker Test] Basis initialized successfully');

        basisModule = module;
        return module;

    } catch (error) {
        console.error('[KTX2 Worker Test] Failed to load BASIS:', error);
        throw error;
    }
}

self.onmessage = async (e) => {
    const { type, rgba, width, height } = e.data;

    if (type === 'TEST_ENCODE') {
        try {
            console.log('[KTX2 Worker Test] Starting test encode...');

            // Load and initialize Basis module in worker context
            const Module = await loadBasisInWorker();

            // Create encoder
            const { BasisEncoder } = Module;
            const basisEncoder = new BasisEncoder();
            console.log('[KTX2 Worker Test] BasisEncoder created');

            // Note: In workers, we always use single-threaded mode
            // The threaded encoder creates its own workers which causes issues
            console.log('[KTX2 Worker Test] Using single-threaded mode (threaded encoder not compatible with workers)');
            basisEncoder.controlThreading(false, 1);

            // Set up encoding (small test)
            const bufferSize = Math.max(1024 * 1024, width * height * 2);
            const ktx2FileData = new Uint8Array(bufferSize);

            basisEncoder.setSliceSourceImage(
                0,
                rgba,
                width,
                height,
                Module.ldr_image_type.cRGBA32.value
            );

            // Configure settings
            basisEncoder.setCreateKTX2File(true);
            basisEncoder.setKTX2UASTCSupercompression(false);
            basisEncoder.setKTX2SRGBTransferFunc(true);
            basisEncoder.setFormatMode(1); // UASTC
            basisEncoder.setPerceptual(true);
            basisEncoder.setMipSRGB(true);
            basisEncoder.setRDOUASTC(false);
            basisEncoder.setMipGen(true);
            basisEncoder.setPackUASTCFlags(1);

            // Attempt encoding
            console.log('[KTX2 Worker Test] Starting encode...');
            const startTime = performance.now();
            const numOutputBytes = basisEncoder.encode(ktx2FileData);
            const elapsed = performance.now() - startTime;

            basisEncoder.delete();

            if (numOutputBytes === 0) {
                throw new Error('Encoding returned 0 bytes');
            }

            console.log(`[KTX2 Worker Test] Success! Encoded in ${elapsed.toFixed(1)}ms -> ${(numOutputBytes / 1024).toFixed(1)}KB`);

            self.postMessage({
                type: 'TEST_SUCCESS',
                data: {
                    elapsed,
                    size: numOutputBytes,
                    threadingSupported: false, // Always single-threaded in workers
                    threadCount: 1
                }
            });

        } catch (error) {
            console.error('[KTX2 Worker Test] Failed:', error);
            self.postMessage({
                type: 'TEST_ERROR',
                error: error.message,
                stack: error.stack
            });
        }
    }
};
