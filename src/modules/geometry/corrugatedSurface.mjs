// Given a blobURL, download it as a file. 
import * as THREE from 'three';

const createCorrugatedSurface = (options) => {
    // console.log('corrugated options', options)

    const { x, y, z, offset } = options;

    let planeWidth = x
    let planeHeight = y
    let amplitude = z / 2
    let frequency = 2 * Math.PI / x

    // let phaseOffset = offset * 2 * Math.PI; // Convert percentage to a phase offset
    let phaseOffset = offset * 2 * Math.PI; // Convert percentage to a phase offset

    // Create corrugated surface geometry
    // Plane Params:  width, height, width segments, height segments 
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 100, 100);
    geometry.rotateX(-Math.PI / 2);


    // Apply sinusoidal wave to the y-coordinate
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const vx = vertices[i]; // x position of vertex
        vertices[i + 1] = amplitude * Math.sin(frequency * vx + phaseOffset); // apply wave with phase offset to y position

        // vertices[i + 1] = amplitude * Math.sin(frequency * x); // apply wave to y position
    }

    geometry.attributes.position.needsUpdate = true;

    // Material for the corrugated surface with Phong shading for better light interaction
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(`hsl(${(offset * 120) + 50}, 100%, 50%)`),
        shininess: 100,
        specular: 0x111111, // Highlights
        side: THREE.DoubleSide,
    });

    // Create a mesh and add it to the scene
    const corrugatedSurface = new THREE.Mesh(geometry, material);
    corrugatedSurface.receiveShadow = true;
    corrugatedSurface.castShadow = true;
    return corrugatedSurface;

};

export { createCorrugatedSurface };

