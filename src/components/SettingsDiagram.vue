<script setup>
    import { ref, onMounted, watch, computed } from 'vue';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    import { useDebounceFn } from '@vueuse/core';
    import { useWindowSize } from '@vueuse/core'
    const { width, height } = useWindowSize()
    const sceneWidth = computed(() => Number.parseInt(width.value * 0.5));
    const sceneHeight = computed(() => Number.parseInt(height.value * 0.3));

    import { useAppStore } from '../stores/appStore';
    import { createCorrugatedSurface } from '../modules/geometry/corrugatedSurface.mjs';

    import { createPlanarSurface } from '../modules/geometry/planarSurface.mjs';
    import { createGlassBox } from '../modules/geometry/glassBox.mjs';
    import { createLights } from '../modules/geometry/lights.mjs';
    const app = useAppStore();  // Pinia store

    const canvasRef = ref(null);
    let renderer = null;  // Reuse the renderer
    let scene = null;     // Reuse the scene
    let camera = null;    // Reuse the camera
    let controls = null;  // Add controls variable for OrbitControls


    const drawScene = () => {

        // If a scene already exists, dispose of it
        if (scene) {
            // Dispose the current scene's children (geometry, materials, etc.)
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    object.material.dispose();
                }
            });
        }

        // Clear the existing renderer if it exists
        if (renderer && canvasRef.value) {
            canvasRef.value.removeChild(renderer.domElement);
        }

        // Scene setup
        scene = new THREE.Scene();

        scene.background = new THREE.Color(0xefefef);  // Set background to null for transparency

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, sceneWidth.value / sceneHeight.value, 0.1, 1000);
        camera.position.z = 10; // Adjusted camera position

        // Renderer setup (recreate only if needed)
        if (!renderer) {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true   // Enable alpha for transparency
            });

        }
        renderer.setSize(sceneWidth.value, sceneHeight.value);
        renderer.shadowMap.enabled = true; // Enable shadows
        canvasRef.value.appendChild(renderer.domElement);


        // Initialize OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Smooth controls
        controls.dampingFactor = 0.1;  // Damp factor for smoothness
        controls.enableZoom = true;     // Enable zooming with the mouse

        const x = 30;
        const y = 5;
        const z = 5;


        // Add the glass box around the plane
        let glassBox = createGlassBox({ x, y, z });
        let lights = createLights();

        scene.add(...glassBox, ...lights);
        let representativeCount = Math.min(Math.ceil(app.crossSectionCount / 10), 10)

        if (app.crossSectionType == 'corrugated') {
            for (let i = 0; i < representativeCount; i++) {
                let corrugatedSurface = createCorrugatedSurface({
                    x, y, z, offset: (1 / representativeCount) * i
                })
                scene.add(corrugatedSurface);
            }
        }
        else if (app.crossSectionType == 'planar') {
            // TODO include the top plane
            // TODO account for wave distribution  option
            for (let i = 0; i < representativeCount; i++) {
                let planarSurface = createPlanarSurface({
                    x, y, z, offset: (1 / representativeCount) * i
                })
                scene.add(planarSurface);
            }
        }




        // Animation loop
        const animate = function () {
            requestAnimationFrame(animate);
            // Optional: rotate for better view
            // corrugatedSurface.rotation.x += 0.01;
            // corrugatedSurface.rotation.y += 0.01; 
            controls.update();  // Ensure controls are updated each frame 
            renderer.render(scene, camera);
        };

        animate();
    };


    // dredraw the scene in debounced fashion when the window size changes
    const debouncedDrawScene = useDebounceFn(drawScene, 100);
    watch(() => [sceneWidth.value, sceneHeight.value], () => debouncedDrawScene());

    // if the app settings change, draw the scene again
    watch(() => [app.crossSectionType, app.crossSectionCount], () => drawScene());

    // Initialize and draw the scene when the component is mounted
    onMounted(() => drawScene());

</script>

<template>
    <div ref="canvasRef"></div>
</template>

<style></style>
