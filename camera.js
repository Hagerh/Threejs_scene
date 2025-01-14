// Import the OrbitControls module
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/controls/OrbitControls.js';

// Add OrbitControls to the camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth damping effect
controls.dampingFactor = 0.05; // Damping factor for smooth motion
controls.enableZoom = true;    // Allow zooming in and out
controls.enablePan = true;     // Allow panning (moving the camera position horizontally and vertically)

// Optional: Set limits for zoom and rotation
controls.minDistance = 5;  // Minimum zoom distance
controls.maxDistance = 50; // Maximum zoom distance
controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation (prevent flipping below the plane)

// Update the controls in the animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Update other game logic
    updateSphereMovement();
    checkPuzzleCollision();
    animateFlyingPieces();

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
