import * as THREE from './node_modules/three/build/three.module.js';
//import { OrbitControls } from './OrbitControls.js';


const feildOfView = 75; //the extent of the observable scene
const minRenderDistance = 0.1;
const maxRenderDistance = 1000;
const LightIntensity = 0.5;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(feildOfView, window.innerWidth / window.innerHeight, minRenderDistance , maxRenderDistance);
camera.position.set(0, 10, 20); //camera postion 


// render setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;    // Enables rendering of shadows in the scene.
renderer.setPixelRatio(window.devicePixelRatio);           
document.body.appendChild(renderer.domElement); //34an tzhr 3la el webpage



// Orbit Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, LightIntensity);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;             //Enables shadows for objects illuminated by this light.
directionalLight.shadow.mapSize.width = 1024;   //higher values create sharper shadows
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

scene.background = new THREE.Color(0x87ceeb); // Sky-blue background


const loader = new THREE.CubeTextureLoader();


// const skyboxTexture = loader.load(
//   [
//     './textures/skybox_px.jpg', './textures/skybox_nx.jpg',
//     './textures/skybox_py.jpg', './textures/skybox_ny.jpg',
//     './textures/skybox_pz.jpg', './textures/skybox_nz.jpg',
//   ],
//   () => {
//     console.log('Skybox loaded successfully');
//   },
//   undefined,
//   (error) => {
//     console.error('Skybox load failed:', error);
//   }
// );
// scene.background = skyboxTexture;

// Add Cube Puzzle to the Scene

const textureLoader = new THREE.TextureLoader();



// Load the puzzle image
const puzzleImage = textureLoader.load('./hour.jpg', (texture) => {
  createPuzzle(texture);          // Ensure the image is loaded before creating the puzzle pieces
});

// Function to create puzzle pieces
function createPuzzle(puzzleImage) {
  const gridSize = 6; 
  const cubeSize = 2; // Size of each small cube
  const puzzleGroup = new THREE.Group(); //easier for rotation 

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const pieceTexture = new THREE.CanvasTexture(document.createElement('canvas'));
        const context = pieceTexture.image.getContext('2d');

        // Set texture coordinates for each piece
        const pieceWidth = puzzleImage.image.width / gridSize;
        const pieceHeight = puzzleImage.image.height / gridSize;
        context.drawImage(  // Crops a portion of the puzzle image for each cube.
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

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize); //Defines the shape of the cube.
        const cube = new THREE.Mesh(geometry, material);                     //Combines the (shape) and  (appearance) into a 3D object.

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
    puzzleGroup.rotation.y += 0.01;  //Rotates the entire puzzle group around the Y-axis.
  }

  function animate() {
    requestAnimationFrame(animate);
    animatePuzzle();
    // controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
