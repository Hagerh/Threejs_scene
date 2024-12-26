import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js';
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
camera.position.set(0, 10, 20);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
scene.fog = new THREE.Fog(0xFFFFFF, 0, 200);

//*********************************************** Render setup ****************************************************** */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

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

const dlightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(dlightHelper);

scene.background = new THREE.Color(0xfffffff); // Darker wood tone

const textureLoader = new THREE.TextureLoader();

//*********************************************** plane setup ****************************************************** */
const planGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xB0B0B0,
    side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planGeometry, planeMaterial);
scene.add(plane);
plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;

const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

//*********************************************** sphere setup ****************************************************** */
const sphereGeometry = new THREE.SphereGeometry(1);
const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xEEEEFF,
    map: textureLoader.load('./hour.jpg')
});
const shpere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(shpere);
shpere.position.set(-10, 10, 0);
shpere.castShadow = true;

// GUI Setup
const gui = new dat.GUI();
const optiones = {
    shpereColor: 0xFFFFFF,
    
};

gui.addColor(optiones, 'shpereColor').onChange(function(e) {
    shpere.material.color.set(e);
});
//gui.add(optiones, 'speed', 0, 0.1);

//*********************************************** Game Logic Setup ****************************************************** */
// Global variables
let puzzleGroup;
let step = 0;

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

// Keyboard controls
const keys = {       //This object defines the keyboard input of the controls.
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
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

// Movement and collision functions
function updateSphereMovement() { 
    if (keys.ArrowUp) sphereVelocity.z -= moveSpeed; // move forward 
    if (keys.ArrowDown) sphereVelocity.z += moveSpeed; // move backward 
    if (keys.ArrowLeft) sphereVelocity.x -= moveSpeed; // left 
    if (keys.ArrowRight) sphereVelocity.x += moveSpeed; //right 
    
    if (keys.Space ) {
        sphereVelocity.y = jumpForce;
        canJump = false;  //prevent double jumping 
    }
    
    sphereVelocity.y += gravity;
    sphereVelocity.x *= 0.8;
    sphereVelocity.z *= 0.8; //as a fraction
    
    shpere.position.x += sphereVelocity.x;
    shpere.position.y += sphereVelocity.y;
    shpere.position.z += sphereVelocity.z;
    
    if (shpere.position.y <= 1) {
        shpere.position.y = 1;  // Place sphere at ground level
        sphereVelocity.y = 0;
        canJump = true;
    }
}

function checkPuzzleCollision() {
    if (!puzzleGroup) return;

    const sphereRadius = 1;                     //sphere collosion radius 
    puzzleGroup.children.forEach((piece) => {
        if (!piece.visible) return;
        
        const distance = shpere.position.distanceTo(piece.position);
        const collisionThreshold = sphereRadius + 1;   // when collision should occur 
        
        if (distance < collisionThreshold) {
            const direction = new THREE.Vector3()               //If objects are close enough to collide
                                                                 // Calculates direction from sphere to piece (normalized to length 1)
                .subVectors(piece.position, shpere.position)
                .normalize();
            
            const force = 1;
            piece.userData.velocity = new THREE.Vector3(
                direction.x * force,
                direction.y * force + 0.5,
                direction.z * force
            );
            
            piece.userData.isFlying = true;  //marked affected by phiysics , "userData" is being used to track the state and physics properties of puzzle pieces:
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

    const material = new THREE.MeshStandardMaterial({
        map: puzzleImage,
        transparent: true,
        opacity: 0.2
    });

    const piece = new THREE.Mesh(geometry, material);
    piece.castShadow = true;
    piece.position.set(
        x * cubeSize - halfSize,
        y * cubeSize - halfSize,
        z * cubeSize - halfSize
    );
    piece.userData.revealed = false;
    piece.userData.velocity = new THREE.Vector3();
    return piece;
}

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
            }
        }
    }

    scene.add(puzzleGroup);
    initializePuzzleInteractivity();
}

function initializePuzzleInteractivity() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(puzzleGroup.children);

        intersects.forEach((intersect) => {
            const face = intersect.object;
            if (!face.userData.revealed) {
                face.material.opacity = 1.0;
                face.userData.revealed = true;
            }
        });
    });
}

//*********************************************** Animation ****************************************************** */
function animate() {
    requestAnimationFrame(animate);
    
    updateSphereMovement();
    
    if (puzzleGroup) {
        puzzleGroup.rotation.y += 0.01;
        checkPuzzleCollision();
        animateFlyingPieces();
    }
    
    renderer.render(scene, camera);
}

//*********************************************** Initialization ****************************************************** */
textureLoader.load('./hour.jpg', (texture) => {
    createPuzzleWithShapes(texture);
    animate();
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});