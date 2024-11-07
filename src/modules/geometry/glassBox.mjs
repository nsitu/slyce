// Given a blobURL, download it as a file. 
import * as THREE from 'three';

const createGlassBox = (options) => {

    const { x, y, z } = options;
    // Create a transparent glass box to contain the plane
    const boxGeometry = new THREE.BoxGeometry(x, y, z);
    const boxMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xaaaaaa,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 1, // Enable transparency
        transparent: true,
        opacity: 0.5, // Control the transparency level
        reflectivity: 0.9, // Add a bit of reflectivity for glass effect
        clearcoat: 0.25,   // Simulates a polished surface
        clearcoatRoughness: 0
    });

    const glassBox = new THREE.Mesh(boxGeometry, boxMaterial);
    glassBox.receiveShadow = true;
    glassBox.castShadow = true;

    // Create Edge Borders for the Glass Box
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x000000, // Black color for edges; adjust as needed
        linewidth: 2      // Note: linewidth may not work on all platforms
    });
    const edgeLines = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    return [glassBox, edgeLines];

};

export { createGlassBox };

