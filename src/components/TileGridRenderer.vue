<template>
    <!-- KTX2 Tile Grid Renderer - Three.js-based texture array viewer -->
    <div
        ref="containerRef"
        class="tile-grid-renderer"
    >
        <div
            v-if="!isInitialized"
            class="loading-message"
        >Initializing renderer...</div>
    </div>
</template>

<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
    import { useAppStore } from '../stores/appStore';

    // Import both renderer implementations
    import { TileGridRendererWebGL } from '../modules/tileGridRenderer-webgl.js';
    import { TileGridRendererWebGPU } from '../modules/tileGridRenderer-webgpu.js';

    // Access the Pinia store
    const app = useAppStore();

    // Choose renderer based on store setting (determined in main.js)
    const TileGridRenderer = computed(() => {
        return app.rendererType === 'webgpu' ? TileGridRendererWebGPU : TileGridRendererWebGL;
    });

    // Props
    const props = defineProps({
        ktx2BlobURLs: {
            type: Object,
            required: true
        },
        outputMode: {
            type: String,
            required: true,
            validator: (value) => ['columns', 'rows'].includes(value)
        }
    });

    // Template refs
    const containerRef = ref(null);

    // Renderer instance
    let renderer = null;
    const isInitialized = ref(false);
    let initializationAttempted = ref(false);

    /**
     * Initialize renderer - called lazily when tiles are available and container is visible
     */
    async function initializeRenderer() {
        if (initializationAttempted.value || !containerRef.value) {
            return;
        }

        initializationAttempted.value = true;
        const container = containerRef.value;

        // Check if container has valid dimensions (is visible)
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (width === 0 || height === 0) {
            console.log('[TileGridRenderer.vue] Container not visible yet, dimensions:', { width, height });
            initializationAttempted.value = false; // Allow retry
            return;
        }

        console.log('[TileGridRenderer.vue] Initializing with dimensions:', { width, height });

        try {
            // Create renderer (type determined by store.rendererType)
            renderer = new TileGridRenderer.value();
            await renderer.init(container, {
                backgroundColor: 0x1a1a1a
            });

            // Start animation loop
            renderer.startAnimation();

            // Load tiles
            loadTiles();

            // Start playback with current settings
            startPlayback();

            isInitialized.value = true;
            console.log('[TileGridRenderer.vue] Initialized successfully');
        } catch (error) {
            console.error('[TileGridRenderer.vue] Initialization failed:', error);
            app.log(`Failed to initialize KTX2 renderer: ${error.message}`);
            initializationAttempted.value = false; // Allow retry
        }
    }


    // Store observer reference for cleanup
    let intersectionObserver = null;

    // Mount: Just set up the container ref, don't initialize yet
    onMounted(async () => {
        await nextTick();
        console.log('[TileGridRenderer.vue] Component mounted, waiting for tiles...');

        // Also watch for when container becomes visible (e.g., tab switch)
        if (containerRef.value) {
            intersectionObserver = new IntersectionObserver((entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isInitialized.value) {
                    console.log('[TileGridRenderer.vue] Container became visible, checking if we can initialize...');
                    // If we have tiles and container is now visible, try to initialize
                    const tileCount = Object.keys(props.ktx2BlobURLs).length;
                    if (tileCount > 0) {
                        initializeRenderer();
                    }
                }
            });

            intersectionObserver.observe(containerRef.value);
        }
    });

    // Cleanup on unmount - must be registered synchronously before any async operations
    onBeforeUnmount(() => {
        // Clean up intersection observer
        if (intersectionObserver) {
            intersectionObserver.disconnect();
            intersectionObserver = null;
        }

        // Clean up renderer
        if (renderer) {
            renderer.dispose();
            renderer = null;
        }
    });

    // Watch for changes in blob URLs - this triggers initialization if not done yet
    watch(() => props.ktx2BlobURLs, async () => {
        const tileCount = Object.keys(props.ktx2BlobURLs).length;

        console.log('[TileGridRenderer.vue] Blob URLs changed, tile count:', tileCount);

        if (tileCount > 0) {
            // We have tiles! Initialize if not done yet
            if (!isInitialized.value) {
                await nextTick(); // Ensure tab is visible
                await initializeRenderer();
            } else {
                // Already initialized, just reload tiles
                loadTiles();
            }
        }
    }, { deep: true, immediate: true });

    // Watch for changes in crossSectionType (cycling mode)
    watch(() => app.crossSectionType, (newMode) => {
        if (renderer && renderer.isPlaying) {
            renderer.stopPlayback();
            renderer.startPlayback({
                fps: renderer.fps,
                mode: newMode
            });
        }
    });

    /**
     * Load all tiles into the renderer
     */
    function loadTiles() {
        if (!renderer) return;

        const tileNumbers = Object.keys(props.ktx2BlobURLs).sort((a, b) => Number(a) - Number(b));
        const tileCount = tileNumbers.length;

        if (tileCount === 0) return;

        // Calculate grid layout based on outputMode
        const { positions, tileSize } = calculateGridLayout(tileCount);

        // Load only new tiles (ones that don't already exist)
        tileNumbers.forEach((tileNumber, index) => {
            // Skip if tile already exists
            if (renderer.tiles.has(tileNumber)) {
                return;
            }

            const blobURL = props.ktx2BlobURLs[tileNumber];
            const position = positions[index];

            renderer.upsertTile(tileNumber, blobURL, position, tileSize)
                .then(() => {
                    console.log(`[TileGridRenderer.vue] Tile ${tileNumber} loaded`);
                })
                .catch(error => {
                    console.error(`[TileGridRenderer.vue] Failed to load tile ${tileNumber}:`, error);
                });
        });
    }

    /**
     * Calculate grid layout positions for tiles
     */
    function calculateGridLayout(tileCount) {
        const positions = [];
        // Make tiles square (1:1 aspect ratio) to match the 256x256 texture
        const tileSize = { width: 2, height: 2 };
        const spacing = 0; // No gap between tiles (flush)

        if (props.outputMode === 'columns') {
            // Grid layout (4 columns)
            const cols = 4;
            const rows = Math.ceil(tileCount / cols);

            for (let i = 0; i < tileCount; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);

                positions.push({
                    x: (col - cols / 2 + 0.5) * (tileSize.width + spacing),
                    y: (rows / 2 - row - 0.5) * (tileSize.height + spacing)
                });
            }
        } else {
            // Column layout (stacked vertically)
            for (let i = 0; i < tileCount; i++) {
                positions.push({
                    x: 0,
                    y: (tileCount / 2 - i - 0.5) * (tileSize.height + spacing)
                });
            }
        }

        return { positions, tileSize };
    }

    /**
     * Start playback with current settings
     */
    function startPlayback() {
        if (!renderer) return;

        renderer.startPlayback({
            fps: app.ktx2Playback.fps,
            mode: app.crossSectionType // 'waves' or 'planes'
        });
    }
</script>

<style scoped>
    .tile-grid-renderer {
        position: relative;
        width: 100%;
        min-width: 800px;
        /* Ensure minimum width even if parent isn't sized */
        height: 600px;
        background: #1a1a1a;
        border-radius: 0.375rem;
        overflow: hidden;
    }

    .loading-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #888;
        font-size: 14px;
        z-index: 10;
    }

    .tile-grid-renderer :deep(canvas) {
        display: block;
        width: 100% !important;
        height: 100% !important;
    }
</style>
