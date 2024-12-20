
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js';
// import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/controls/OrbitControls.js';
//import { OrbitControls } from 'https://unpkg.com/three@0.171.0/examples/jsm/controls/OrbitControls.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js';




//*********************************************** scene setup ****************************************************** */
const feildOfView = 75;
const minRenderDistance = 0.1;
const maxRenderDistance = 1000;
const LightIntensity = 0.5;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  feildOfView,
  window.innerWidth / window.innerHeight,
  minRenderDistance,
  maxRenderDistance
);
camera.position.set(0, 10, 20); // Camera position

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
scene.fog = new THREE.Fog(0xFFFFFF,0,200);
//*********************************************** Render setup ****************************************************** */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//Orbit Controls
// const orbit = new OrbitControls(camera, renderer.domElement);
// orbit.enableDamping = true;

//*********************************************** lightning setup ****************************************************** */

const ambientLight = new THREE.AmbientLight(0xffffff, LightIntensity);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-30, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);
directionalLight.shadow.camera.bottom = -12;
const dlightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(dlightShadowHelper);
const dlightHelper = new THREE.DirectionalLightHelper(directionalLight,5);
scene.add(dlightHelper);
scene.background = new THREE.Color(0x6A4E23); // Darker wood tone


const textureLoader = new THREE.TextureLoader();


//*********************************************** plane setup ****************************************************** */

const planGeometry = new THREE.PlaneGeometry(30,30);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xB0B0B0,
  side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planGeometry,planeMaterial);
scene.add(plane);
plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;
const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

//*********************************************** shpere setup ****************************************************** */

const sphereGeometry = new THREE.SphereGeometry(2);
const sphereMaterial = new THREE.MeshBasicMaterial({
  color: 0xEEEEFF,
  map: textureLoader.load('./hour.jpg')
});
const shpere = new THREE.Mesh(sphereGeometry,sphereMaterial);
scene.add(shpere);

shpere.position.set(-5,10,0);
shpere.castShadow =  true;

const gui = new dat.GUI();
const optiones = {
  shpereColor: 0xFFFFFF,
  speed : 0.01
};
gui.addColor(optiones, 'shpereColor').onChange(function(e){
  shpere.material.color.set(e);

});

gui.add(optiones, 'speed', 0 , 0.1);



//*********************************************** Puzzle setup ****************************************************** */

// Function to create a puzzle piece (generalized for different geometries)

function createPuzzlePiece(x, y, z, gridSize, puzzleImage, shapeType, cubeSize) {
  let geometry;
  const halfSize = (gridSize * cubeSize) / 2;

  // Switch between different shapes
  switch (shapeType) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(cubeSize / 2, 32, 32); // Sphere shape
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(cubeSize / 2, cubeSize, 32); // Cone shape
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(cubeSize / 2, cubeSize / 4, 16, 100); // Torus shape
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(cubeSize / 2, cubeSize / 2, cubeSize, 32); // Cylinder
      break;
    default:
      geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize); // Default is cube
  }

  // Create a texture material
  const material = new THREE.MeshStandardMaterial({
    map: puzzleImage,
    transparent: true,
    opacity: 0.2, // Initially hidden
    
  });

  const piece = new THREE.Mesh(geometry, material);
  piece.castShadow = true;

  // Position the piece
  piece.position.set(
    x * cubeSize - halfSize,
    y * cubeSize - halfSize,
    z * cubeSize - halfSize
  );

  piece.userData.revealed = false; // Mark as hidden
  return piece;
}

// Function to create puzzle pieces with multiple shapes
function createPuzzleWithShapes(puzzleImage) {
  const gridSize = 6; // Number of pieces per dimension
  const cubeSize = 2; // Size of each piece
  const puzzleGroup = new THREE.Group();

  const shapes = ['box', 'sphere', 'cone', 'torus', 'cylinder']; // List of shapes to include

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const shapeType = shapes[(x + y + z) % shapes.length]; // Cycle through shapes
        const piece = createPuzzlePiece(x, y, z, gridSize, puzzleImage, shapeType, cubeSize);
        puzzleGroup.add(piece);
      }
    }
  }

  scene.add(puzzleGroup);
 
//*********************************************** hovering ****************************************************** */

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(puzzleGroup.children);

    intersects.forEach((intersect) => {
      const face = intersect.object;
      if (!face.userData.revealed) {
        face.material.opacity = 1.0; // Reveal the texture
        face.userData.revealed = true;
      }
    });
    return puzzleGroup;
  }

  window.addEventListener('mousemove', onMouseMove);


//*********************************************** animate ****************************************************** */

  function animatePuzzle() {
    puzzleGroup.rotation.y += 0.01; // Rotate the entire puzzle group
  }

  // Add puzzle animation to global animate loop
  function globalAnimate() {
    animatePuzzle();
  }
  animateCallbacks.push(globalAnimate); // Add animation to global list
}

// Load the puzzle image and create shapes
const puzzleImage = textureLoader.load('./hour.jpg', (texture) => {
  createPuzzleWithShapes(texture);
});


// Function to check if the sphere collides with any puzzle piece
// function checkCollisionWithPuzzle(sphere) {
//   const raycaster = new THREE.Raycaster();
//   const direction = new THREE.Vector3(0, -1, 0); // Direction downwards (for simplicity, can be adjusted)
//   raycaster.ray.origin.copy(sphere.position);
//   raycaster.ray.direction.copy(direction);

//   // Find the closest intersected object
//   const intersects = raycaster.intersectObjects(puzzleGroup.children);

//   // If there is an intersection, trigger the collision behavior
//   if (intersects.length > 0) {
//     const intersectedPiece = intersects[0].object;
//     if (!intersectedPiece.userData.revealed) {
//       intersectedPiece.userData.revealed = true;
      
//       // Make the piece disappear or throw it away
//       intersectedPiece.material.opacity = 0; // Disappear
//       intersectedPiece.position.y = -50; // Throw away (you can adjust the distance)
      
//       // Optionally, add a force to the piece to make it fly away
//       const randomDirection = new THREE.Vector3(
//         Math.random() - 0.5,
//         Math.random() - 0.5,
//         Math.random() - 0.5
//       ).normalize();
      
//       // Apply a movement force (this can be tweaked)
//       intersectedPiece.position.add(randomDirection.multiplyScalar(10));
//     }
//   }
// }





let step =0;

// Global animate loop
const animateCallbacks = [];

// function animate() {
//   requestAnimationFrame(animate);

//   step += optiones.speed;
//   shpere.position.y = 10 * Math.abs(Math.sin(step)); // Moving the sphere

//   // Move the sphere along the X and Z axis (for more randomness)
//   shpere.position.x += Math.sin(step) * 0.1; // Moves left/right
//   shpere.position.z += Math.cos(step) * 0.1; // Moves forward/backward

//   // Check for collision with puzzle pieces
//   checkCollisionWithPuzzle(shpere);

//   // Update controls (if using orbit controls)
//   // orbit.update();

//   // Call all animations for the puzzle pieces
//   animateCallbacks.forEach((callback) => callback());

//   // Render the scene
//   renderer.render(scene, camera);
// }

// animate();
function animate() {
  requestAnimationFrame(animate);

  step += optiones.speed;
  shpere.position.y= 10 * Math.abs(Math.sin(step));

 //Move the sphere along the X and Z axis (for more randomness)
  shpere.position.x += Math.sin(step) * 0.1; // Moves left/right
  shpere.position.z += Math.cos(step) * 0.1; // Moves forward/backward
  // Check for collision with puzzle pieces
  // checkCollisionWithPuzzle(shpere);

  // Update controls
    // orbit.update();

  // Call all animations
  animateCallbacks.forEach((callback) => callback());

  // Render the scene
  renderer.render(scene, camera);
}
animate();