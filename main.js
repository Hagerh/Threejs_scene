import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js';
import { OrbitControls } from './OrbitControls.js';


//*********** Lives logic********/
// Image paths for lives
const validLifeImage = './heart.png';  // Image for a valid life
const lostLifeImage = './broken-heart.png';    // Image for a lost life
// Define lives and starting position for the sphere
let lives = 3;
const startingPosition = { x: -12, y: -0.5, z: 0 };

// Update the lives display
function initializeLivesDisplay() {
    const heartsDisplay = document.getElementById('lives-display');
    heartsDisplay.innerHTML = ''; // Clear any existing hearts

    // Create 3 hearts, all red initially
    for (let i = 0; i < 3; i++) {
        const heartImg = document.createElement('img');
        heartImg.src = validLifeImage;; // All hearts are red initially
        heartsDisplay.appendChild(heartImg);
    }
}
function updateLivesDisplay() {
    const heartsDisplay = document.getElementById('lives-display');
    heartsDisplay.innerHTML = ''; // Clear previous hearts

    // Create 3 hearts and set their color based on lives
    for (let i = 0; i < 3; i++) {
        const heartImg = document.createElement('img');
        if (i < lives) {
            heartImg.src = validLifeImage;  // Show valid life image
        } else {
            heartImg.src = lostLifeImage;   // Show lost life image
        }
        heartsDisplay.appendChild(heartImg);
    }
}
// Call this function to initialize the display at the start
initializeLivesDisplay();

//*********** Restart logic********/
// Get the restart button element
const restartButton = document.getElementById('restart-button');

//*********************************initalizing counters for score model ***********/
let totalPuzzlePieces = 0; // Total number of pieces in the puzzle
let userInteractedPieces = 0; // Pieces collided with or revealed

//*********************************************** scene setup ****************************************************** */
const feildOfView = 75;
const minRenderDistance = 0.1;
const maxRenderDistance = 1000;
const LightIntensity = 1;
let gameStarted = false; 

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    feildOfView,
    window.innerWidth / window.innerHeight,
    minRenderDistance,
    maxRenderDistance
);
camera.position.set(0, 10, 20);
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Ensures the camera looks at the scene center


scene.fog = new THREE.Fog(0xFFFFFF, 0, 200);


//*********************************************** Render setup ****************************************************** */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

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

const loader = new THREE.TextureLoader();
const backTexture = loader.load('./textures/back.png'); // Replace with your image path
// Set the scene background to the image
scene.background = backTexture;

const textureLoader = new THREE.TextureLoader();

// Load textures for different shapes
const textures = {
    box: textureLoader.load('./textures/box.jpg'),
    sphere: textureLoader.load('./textures/sphere.jpg'),
    cone: textureLoader.load('./textures/cone.jpg'),
    torus: textureLoader.load('./textures/torus.png'),
    cylinder: textureLoader.load('./textures/cylinder.jpg'),
};
//*********************************************** plane setup ****************************************************** */
// Plane setup with animation parameters
const planGeometry = new THREE.BoxGeometry(30, 30,0.3); //x: -15 to 15, z: -15 to 15

// Create the material with the texture and transparency
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White color
    transparent: true,
    opacity: 0.4, // Semi-transparent
    roughness: 0.3, // Smooth surface
    metalness: 0.3, // reflectivity
    //transmission: 0.9, // Allow light to pass through
    //ior: 1.5, // Index of Refraction             // Adjust metalness if needed
});
const plane = new THREE.Mesh(planGeometry, planeMaterial);
scene.add(plane);
plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;
// Add this line to move the plane to the bottom of the cube
plane.position.y = -1.5;



// Load Audio for Collision
const listener = new THREE.AudioListener();
camera.add(listener);

const collisionSound = new THREE.Audio(listener);
const jumpsound = new THREE.Audio(listener);
const buttonSound= new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./textures/hitball.mp3.m4a', (buffer) => {
    collisionSound.setBuffer(buffer);
    collisionSound.setLoop(false); // Play sound once per collision
    collisionSound.setVolume(0.3); // Adjust volume
    
}); 
audioLoader.load('./textures/ballJump.m4a', (buffer) => {
    jumpsound.setBuffer(buffer);
    jumpsound.setLoop(false); // Play sound once per collision
    jumpsound.setVolume(1.2); // Adjust volume
}); 
audioLoader.load('./textures/hitball.mp3.m4a', (buffer) => {
    buttonSound.setBuffer(buffer);
    buttonSound.setLoop(false); // Play sound once per collision
    buttonSound.setVolume(0.3); // Adjust volume
    
}); 

//*********************************************** sphere setup ****************************************************** */
const sphereGeometry = new THREE.SphereGeometry(1);
const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xEEEEFF,
    map: textureLoader.load('./textures/purple.png')
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);
sphere.position.set(-12, 10, 0);//initial sphere position
sphere.castShadow = true;

//**************************************************/ GUI Setup *********************************************************** */
const gui = new dat.GUI();
const optiones = {
    sphereColor: 0xFFFFFF,
    // frequency: 0,
    // amplitude: 0,
    planeColor: 0xFFFFFF,
};

gui.addColor(optiones, 'planeColor').onChange(function(e) {
   plane.material.color.set(e);
});
gui.addColor(optiones, 'sphereColor').onChange(function(e) {
    sphere.material.color.set(e);
});

//*********************************************** Game Logic Setup ****************************************************** */
// Global variables
let puzzleGroup;

// Sphere movement setup
const sphereVelocity = {
    x: 0,
    y: 0,
    z: 0
};
const moveSpeed = 0.1;
const gravity = -0.07;
const jumpForce = 0.8;
let canJump = false; //prevent unlimited jumping 

// Update the keys object definition to include a reset function
const keys = {       
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    reset() {
        this.ArrowUp = false;
        this.ArrowDown = false;
        this.ArrowLeft = false;
        this.ArrowRight = false;
        this.Space = false;
    }
};

window.addEventListener('keydown', (e) => {  //triggers when key is pressed 
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Movement and collision functions(updates the position and velocity of a sphere in a 3D environment based on user input and gravity. 
// It handles movement in the x, y, and z axes, jumping, and collision with the boundaries of a plane.)
// Update the updateSphereMovement function to include additional checks
function updateSphereMovement() { 
    if (!gameStarted) {
        // Ensure the sphere stays in starting position when game is not started
        sphere.position.set(startingPosition.x, startingPosition.y, startingPosition.z);
        sphereVelocity.x = 0;
        sphereVelocity.y = 0;
        sphereVelocity.z = 0;
        return;
    }

    if (keys.ArrowUp) sphereVelocity.z -= moveSpeed;
    if (keys.ArrowDown) sphereVelocity.z += moveSpeed;
    if (keys.ArrowLeft) sphereVelocity.x -= moveSpeed;
    if (keys.ArrowRight) sphereVelocity.x += moveSpeed;
    
    if (keys.Space && canJump) {
        sphereVelocity.y = jumpForce;
        canJump = false;
        if (!jumpsound.isPlaying) jumpsound.play();
    }
    
    sphereVelocity.y += gravity;
    sphereVelocity.x *= 0.8;
    sphereVelocity.z *= 0.8;
    
    sphere.position.x += sphereVelocity.x;
    sphere.position.y += sphereVelocity.y;
    sphere.position.z += sphereVelocity.z;

    const planeHalfSize = 15;
    if (
        sphere.position.x < -planeHalfSize ||
        sphere.position.x > planeHalfSize ||
        sphere.position.z < -planeHalfSize ||
        sphere.position.z > planeHalfSize
    ) {
        if (lives > 1) {
            lives--;
            updateLivesDisplay();
            // Reset position and velocity when losing a life
            sphere.position.set(startingPosition.x, startingPosition.y, startingPosition.z);
            sphereVelocity.x = 0;
            sphereVelocity.y = 0;
            sphereVelocity.z = 0;
        } else {
            // Game over
            alert('Game Over!');
            lives = 0;
            updateLivesDisplay();
            gameStarted = false;
            // Show the restart button
            restartButton.style.display = 'block';
            // Reset all movement
            keys.reset();
            sphereVelocity.x = 0;
            sphereVelocity.y = 0;
            sphereVelocity.z = 0;
        }
    } else {
        if (sphere.position.y <= plane.position.y + sphere.geometry.parameters.radius) {
            sphere.position.y = plane.position.y + sphere.geometry.parameters.radius;
            sphereVelocity.y = 0;
            canJump = true;
        }
    }
}

//**************Update progress bar */
function updateProgressBar() {
    const progress = (userInteractedPieces / totalPuzzlePieces) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').innerText = `${userInteractedPieces}/${totalPuzzlePieces}`;
}

/**
 * Checks if the sphere (sphere) is colliding with any of the puzzle pieces.
 * If a collision is detected, it applies a force to the puzzle piece,
 * making it move away from the sphere. The force is calculated based on the
 * direction from the sphere to the piece. The puzzle piece is also marked as
 * being affected by physics (userData.isFlying = true).
 * @function checkPuzzleCollision
 */
function checkPuzzleCollision() {
    if (!puzzleGroup) return;

    const sphereRadius = 1;                     //sphere collosion radius 
    puzzleGroup.children.forEach((piece) => {
        if (!piece.visible) return;
        
        const distance = sphere.position.distanceTo(piece.position);
        const collisionThreshold = sphereRadius + 1;   // when collision should occur 
        
        if (distance < collisionThreshold) {
            const direction = new THREE.Vector3()               //If objects are close enough to collide
                                                                 // Calculates direction from sphere to piece (normalized to length 1)
                .subVectors(piece.position, sphere.position)
                .normalize();
            
            const force = 1;
            piece.userData.velocity = new THREE.Vector3(
                direction.x * force,
                direction.y * force + 0.5,
                direction.z * force
            );
            
            piece.userData.isFlying = true;  //marked affected by phiysics , "userData" is being used to track the state and physics properties of puzzle pieces:
            
            // Increment interaction count if not already interacted
            if (!piece.userData.collided) {
                userInteractedPieces++;
                piece.userData.collided = true; // Mark as interacted
                updateProgressBar();
            }

            // Play collision sound
            if (!collisionSound.isPlaying) {
               collisionSound.play();
            }
        }
    });
}

//**************************************** Animateion for piecies after getting hit by the ball  ******************************************************************** */
function animateFlyingPieces() {
    if (!puzzleGroup) return;

    puzzleGroup.children.forEach(piece => {
        if (piece.userData.isFlying) {  // Only animate pieces that were hit
            piece.position.add(piece.userData.velocity);  //Updates position using stored velocity
                                                          // Gradually decreases vertical velocity (making piece fall)
            piece.userData.velocity.y -= 0.01;
            piece.rotation.x += 0.2;       //Makes pieces spin as they fly
            piece.rotation.z += 0.2; 
        }
    });
}

//*********************************************** Puzzle Creation ****************************************************** */

//create a 3D puzzle piece with a specified shape
function createPuzzlePiece(x, y, z, gridSize, puzzleImage, shapeType, cubeSize) {
    let geometry;
    const halfSize = (gridSize * cubeSize) / 2;

    switch (shapeType) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(cubeSize / 2, 32, 32);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(cubeSize / 2, cubeSize, 32);
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(cubeSize / 2, cubeSize / 4, 16, 100);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(cubeSize / 2, cubeSize / 2, cubeSize, 32);
            break;
        default:
            geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    }

    // Select texture based on shape type
    const texture = textures[shapeType] || textures.box; // Default to box texture if shapeType is not found

    // creates a new material for the 3D puzzle piece
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0.2
    });

    const piece = new THREE.Mesh(geometry, material);
    piece.castShadow = true; //  the mesh should cast shadows.
    piece.position.set( //center the piece within the grid.
        x * cubeSize - halfSize,
        y * cubeSize - halfSize+ gridSize * cubeSize / 2, // Adjust y position to ensure full grid coverage,
        z * cubeSize - halfSize
    );
    //properties to track the piece state
    piece.userData.revealed = false;  //  piece has been revealed ?
    piece.userData.velocity = new THREE.Vector3(); //velocity of the piece
    return piece;
}

/**
 * Creates a 3D puzzle composed of various geometric shapes and adds it to the scene.
 * The puzzle is constructed as a grid of shapes with a specified texture.
 * Interactivity is initialized to allow revealing of puzzle pieces.
 *
 * @param {THREE.Texture} puzzleImage - Texture to be applied to the puzzle pieces.
 */

function createPuzzleWithShapes(puzzleImage) {
    const gridSize = 6;
    const cubeSize = 2;
    puzzleGroup = new THREE.Group();

    const shapes = ['box', 'sphere', 'cone', 'torus', 'cylinder'];

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                const shapeType = shapes[(x + y + z) % shapes.length];
                const piece = createPuzzlePiece(x, y, z, gridSize, puzzleImage, shapeType, cubeSize);
                puzzleGroup.add(piece);
                totalPuzzlePieces++; // Increment the total puzzle pieces
            }
        }
    }
    scene.add(puzzleGroup);
    initializePuzzleInteractivity();
}

/*********************************************************** Raycasting to reveal puzzle pieces ******************************/
 function initializePuzzleInteractivity() {
     const raycaster = new THREE.Raycaster();
     const mouse = new THREE.Vector2(); 

     window.addEventListener('mousemove', (event) => {
         mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
         mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

         raycaster.setFromCamera(mouse, camera);    // generates a ray starting from the camera's position and pointing through the mouse's location in the 3D scene.
         const intersects = raycaster.intersectObjects(puzzleGroup.children);  //checks which objects in the puzzleGroup the ray intersects. 
                                                                                //It returns an array of intersection objects sorted by distance from the camera.

         intersects.forEach((intersect) => {
             const face = intersect.object;
             if(!gameStarted) return;
             if (!face.userData.revealed) {
                 face.material.opacity = 1.0;
                 face.userData.revealed = true;
             }
         });
     });
 }



/*********************************************** Restart Game ****************************************************** */

// Update the restart function
function restartGame() {
    // Stop the game
    gameStarted = false;

    // Reset all keyboard inputs
    keys.reset();

    // Show the overlay (start screen)
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('hidden');

    // Reset the sphere position and velocity
    sphere.position.set(startingPosition.x, startingPosition.y, startingPosition.z);
    sphereVelocity.x = 0;
    sphereVelocity.y = 0;
    sphereVelocity.z = 0;

    // Reset jump state
    canJump = false;
    
    // Reset lives
    lives = 3;
    updateLivesDisplay();
    
    // Reset progress bar
    userInteractedPieces = 0;
    updateProgressBar();
    
    // Remove and dispose of the old puzzleGroup
    if (puzzleGroup) {
        for (let i = 0; i < puzzleGroup.children.length; i++) {
            const piece = puzzleGroup.children[i];
            // Reset piece state
            piece.userData.isFlying = false;
            piece.userData.collided = false;
            piece.userData.revealed = false;
            piece.material.opacity = 0.2;
            piece.userData.velocity = new THREE.Vector3();
            piece.geometry.dispose();
            piece.material.dispose();
        }
        scene.remove(puzzleGroup);
        puzzleGroup = null;
    }
    
    // Recreate puzzleGroup after loading the texture
    textureLoader.load('./textures/purple.png', (texture) => {
        createPuzzleWithShapes(texture);
        
        // Hide restart button
        restartButton.style.display = 'none';
    });
    
    // Reset camera position and controls
    camera.position.set(0, 10, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.reset();
}


//*********************************************** animation ****************************************************** */
// Update the animate function
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();

    if (gameStarted) {
        updateSphereMovement();
        
        if (puzzleGroup) {
            puzzleGroup.rotation.y += 0.01;
            checkPuzzleCollision();
            animateFlyingPieces();
        }
    }
    
    renderer.render(scene, camera);
}

//*********************************************** Initialization ****************************************************** */
textureLoader.load('./textures/purple.png', (texture) => {
    createPuzzleWithShapes(texture);
    animate();
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//*********************************************** overlay setup ****************************************************** */
// Update start button event listener
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    buttonSound.play();
    const overlay = document.getElementById('overlay');
    overlay.classList.add('hidden'); // Hide the overlay
    gameStarted = true; // Start the game
})

// Add event listener for the restart button
restartButton.addEventListener('click', () => {
    restartGame(); // Call the restart function when the restart button is clicked
    buttonSound.play(); // Play restart sound (optional)
});