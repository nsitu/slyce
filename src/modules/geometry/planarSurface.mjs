import * as THREE from 'three';

const createPlanarSurface = (options) => {
    console.log('plane surface options', options);

    const { x, y, z, offset } = options;

    let planeWidth = x;
    let planeHeight = y;



    // instead of a cosine distribution, we can use 
    // a sigmoid function to adjust the position of the plane surface
    // Look into using a sigmoid function to adjust the position of the plane surface
    // https://public--main--trig--sikkemha.ixdcoder.com/sigmoid.html

    // offset will be some number between 0 and 1 
    // offset will be used to adjust the position of the plane surface along the z-axis


    // Adjust position along the z-axis using cosine distribution
    const cosineOffset = 0.5 + 0.5 * Math.cos(offset * Math.PI); // Maps offset to a cosine curve
    let position = (z * cosineOffset) - (0.5 * z);

    // Create plane surface geometry
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 100, 100);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, position, 0);

    // Material for the plane surface with Phong shading for better light interaction
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(`hsl(${(cosineOffset * 120) + 50}, 100%, 50%)`),
        shininess: 100,
        specular: 0x111111,
        side: THREE.DoubleSide,
    });

    // Create a mesh and add it to the scene
    const planeSurface = new THREE.Mesh(geometry, material);
    planeSurface.receiveShadow = true;
    planeSurface.castShadow = true;
    return planeSurface;
};

export { createPlanarSurface };
