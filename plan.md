# Cleanup Plan: Remove basis_encoder_threads Support

## Background
Previously, we aimed to support `basis_encoder_threads.wasm` for multi-threaded encoding. However, we discovered significant challenges:

1. **Cross-Origin Isolation Requirement**: The threaded encoder requires SharedArrayBuffer support, which necessitates COOP/COEP headers. While we achieved this on GitHub Pages using `coi-serviceworker.js`, it adds complexity and potential failure points.

2. **Worker Nesting Issues**: The threaded encoder spawns its own workers internally. When we tried to use it inside our own workers for parallel processing, we encountered nested worker problems that were difficult to resolve.

3. **Better Alternative**: We now use the single-threaded `basis_encoder.wasm` running inside multiple web workers that we manage ourselves (via `KTX2WorkerPool`). This gives similar overall performance - while individual layers encode more slowly, the aggregate parallelism across all workers provides equivalent throughput.

## Cleanup Tasks

### 1. Remove Threading Detection & Support Code

#### `src/utils/wasm-utils.js`
- ✅ **KEEP THIS FILE** but simplify it:
  - Remove `getWasmThreadingDiagnostics()` function (no longer needed)
  - Remove `checkIsWasmThreadingSupported()` function
  - Remove `threadingSupported` export and all related checks
  - Keep `getOptimalThreadCount()` and `optimalThreadCount` (still used for worker pool sizing)
  - Remove all console logging about threading support/diagnostics

#### `src/modules/load_basis.js`
- Remove `threadingSupported` import from wasm-utils
- Remove conditional logic that chooses between threaded/non-threaded versions
- Always load `./wasm/basis_encoder.js` (single-threaded version)
- Remove all references to `basis_encoder_threads.js`
- Simplify console logging to not mention threading

#### `src/modules/ktx2-encoder.js`
- Remove `threadingSupported` import from wasm-utils
- Remove `multithreading` from settings object
- Remove the conditional `controlThreading()` logic
- Always use single-threaded mode: `basisEncoder.controlThreading(false, 1);`
- Remove `optimalThreadCount` import (not used here, only in worker pool)

### 2. Clean Up Worker Files

#### `src/workers/ktx2EncoderWorker.js`
- Remove `threadingSupported` and `optimalThreadCount` imports
- Remove comments about "threaded encoder not compatible with workers"
- Simplify - just document that we use single-threaded encoder
- Already hardcoded to single-threaded: `basisEncoder.controlThreading(false, 1);` ✅

#### `src/workers/ktx2EncoderTest.js`
- Remove `threadingSupported` and `optimalThreadCount` imports  
- Remove comments about threading compatibility
- Remove `threadingSupported: false` from the response data
- Simplify comments to just explain single-threaded usage

### 3. Remove Cross-Origin Isolation Support

#### `index.html`
- Remove the `<script src="./coi-serviceworker.js"></script>` line
- Add comment explaining we don't need cross-origin isolation anymore

#### `public/coi-serviceworker.js`
- **DELETE THIS FILE** - no longer needed since we don't use SharedArrayBuffer

### 4. Keep Threaded Encoder Files for Reference

#### `public/wasm/`
- **KEEP** `basis_encoder_threads.js` and `basis_encoder_threads.wasm` for reference
- **KEEP** `basis_encoder.js` and `basis_encoder.wasm` (single-threaded version - actively used)
- **KEEP** transcoder files (still needed)

#### `public/wasm/readme.md`
- **UPDATE** with comprehensive threading architecture explanation
- Document why we use single-threaded encoder in worker pool
- Explain challenges with threaded encoder (cross-origin isolation, worker nesting)
- Note that threaded files are kept for reference but not used in production
- Remove future plans about "making optimized multithreaded build"

### 5. Update Memory Utilities

#### `src/utils/memory-utils.js`
- Remove `threadingSupported` and `optimalThreadCount` imports
- Remove `threadingSupported` from `getMemoryInfo()` return object
- Remove `sharedArrayBufferSupported` check (no longer relevant)
- Keep other memory diagnostics as they're still useful

### 6. Remove Testing Code (Optional)

#### `src/utils/ktx2-worker-test.js`
- Consider removing this file entirely if it's only used for threading tests
- OR update it to just test worker pool functionality without threading checks
- Remove any references to `threadingSupported` or multi-threading

### 7. Update Documentation Comments

#### Throughout codebase:
- Search for comments mentioning "threaded encoder", "threading", "SharedArrayBuffer", etc.
- Update to reflect current single-threaded + worker pool architecture
- Remove any conditional logic explanations about threading

## Benefits of This Cleanup

1. **Simpler Codebase**: Remove ~200+ lines of conditional logic and diagnostics
2. **Easier Deployment**: No need for cross-origin isolation setup
3. **Better Maintainability**: One clear path instead of multiple code branches
4. **Clearer Architecture**: Worker pool pattern is explicit and well-understood
5. **Fewer Dependencies**: Remove service worker polyfill dependency

## Testing After Cleanup

1. Verify encoding still works on all platforms
2. Check that worker pool creates correct number of workers
3. Ensure performance is equivalent to before
4. Test on both localhost and GitHub Pages deployment
5. Verify on different browsers (Chrome, Firefox, Safari)

## Notes

- The `optimalThreadCount` is still valuable for determining worker pool size
- Worker pool architecture (`KTX2WorkerPool`) remains unchanged
- Core encoding functionality in `KTX2Encoder` remains the same
- All encoding quality settings remain unchanged
