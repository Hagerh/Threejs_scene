import * as THREE from '/node_modules/three';
import { OrbitControls } from './js/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Add Cube Puzzle to the Scene
const textureLoader = new THREE.TextureLoader();

// Load the puzzle image
const puzzleImage = textureLoader.load('./hour.jpg', (texture) => {
  // Ensure the image is loaded before creating the puzzle pieces
  createPuzzle(texture);
});

// Function to create puzzle pieces
function createPuzzle(puzzleImage) {
  const gridSize = 6;
  const cubeSize = 2; // Size of each small cube
  const puzzleGroup = new THREE.Group();

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const pieceTexture = new THREE.CanvasTexture(document.createElement('canvas'));
        const context = pieceTexture.image.getContext('2d');

        // Set texture coordinates for each piece
        const pieceWidth = puzzleImage.image.width / gridSize;
        const pieceHeight = puzzleImage.image.height / gridSize;
        context.drawImage(
          puzzleImage.image,
          x * pieceWidth,
          y * pieceHeight,
          pieceWidth,
          pieceHeight,
          0,
          0,
          pieceWidth,
          pieceHeight
        );

        const material = new THREE.MeshStandardMaterial({
          map: pieceTexture,
          transparent: true,
          opacity: 0.2, // Initially hidden
        });

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cube = new THREE.Mesh(geometry, material);

        cube.position.set(
          x * cubeSize - (gridSize * cubeSize) / 2,
          y * cubeSize - (gridSize * cubeSize) / 2,
          z * cubeSize - (gridSize * cubeSize) / 2
        );
        cube.userData.revealed = false; // Track whether the face is revealed
        puzzleGroup.add(cube);
      }
    }
  }

  scene.add(puzzleGroup);

  // Raycasting for hover interaction
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
  }

  window.addEventListener('mousemove', onMouseMove);

  // Animate the Puzzle Group (optional rotation)
  function animatePuzzle() {
    puzzleGroup.rotation.y += 0.01;
  }

  function animate() {
    requestAnimationFrame(animate);
    animatePuzzle();
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
