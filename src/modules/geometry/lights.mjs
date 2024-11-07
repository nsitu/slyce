// Given a blobURL, download it as a file. 
import * as THREE from 'three';

const createLights = () => {

    // const { x, y, z } = options;
    const ambientLight = new THREE.AmbientLight(0x808080, 0.5); // Soft ambient light


    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Strong directional light
    directionalLight.position.set(5, 10, 7.5); // Position the light above the surface
    directionalLight.castShadow = true;

    return [ambientLight, directionalLight];

};

export { createLights };

