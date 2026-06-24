import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- STATE MANAGEMENT ---
const defaults = {
  color: '#818cf8',
  roughness: 0.4,
  metalness: 0.2,
  speed: 1.0,
  lightIntensity: 2.5,
  autoRotate: true,
  preset: 'standard'
};

let state = { ...defaults };

// --- DOM ELEMENTS ---
const canvas = document.getElementById('threejs-canvas');
const container = canvas.parentElement;

const inputPresetButtons = document.querySelectorAll('#material-presets .segment-btn');
const inputColor = document.getElementById('cube-color');
const inputColorHexText = document.getElementById('color-hex');
const colorPresets = document.querySelectorAll('.color-preset');

const inputRoughness = document.getElementById('cube-roughness');
const labelRoughness = document.getElementById('val-roughness');

const inputMetalness = document.getElementById('cube-metalness');
const labelMetalness = document.getElementById('val-metalness');

const inputSpeed = document.getElementById('cube-speed');
const labelSpeed = document.getElementById('val-speed');

const inputLightIntensity = document.getElementById('light-intensity');
const labelLightIntensity = document.getElementById('val-light');

const inputToggleRotation = document.getElementById('toggle-rotation');
const btnReset = document.getElementById('reset-btn');

// Stats DOM Elements
const statFps = document.getElementById('stat-fps');
const statPreset = document.getElementById('stat-preset');
const statFaces = document.getElementById('stat-faces');
const statAngle = document.getElementById('stat-angle');

// --- THREE.JS INITIALIZATION ---

// 1. Scene
const scene = new THREE.Scene();

// 2. Camera
const camera = new THREE.PerspectiveCamera(
  45, 
  container.clientWidth / container.clientHeight, 
  0.1, 
  100
);
camera.position.set(0, 0, 4);

// 3. Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true // Enables transparent background to show body radial gradients
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. Geometry
const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);

// 5. Material
const material = new THREE.MeshStandardMaterial({
  color: new THREE.Color(state.color),
  roughness: state.roughness,
  metalness: state.metalness
});

// 6. Mesh
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 7. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, state.lightIntensity);
pointLight.position.set(3, 3, 3);
scene.add(pointLight);

// Optional: Add a subtle second light to make metalness highlights pop from other side
const dirLight = new THREE.DirectionalLight(0x818cf8, 0.4);
dirLight.position.set(-3, -3, -1);
scene.add(dirLight);

// Orbit Controls (Premium User Experience Addition)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.5;
controls.maxDistance = 7;
controls.enablePan = false; // Restrict panning to keep center focus

// Update statistics panels
statFaces.textContent = `${geometry.index ? geometry.index.count / 3 : 12} Tris`;

// --- RENDERING LOOP ---

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function animate() {
  requestAnimationFrame(animate);

  // Rotate mesh if toggled
  if (state.autoRotate) {
    const rotationIncrement = 0.008 * state.speed;
    cube.rotation.x += rotationIncrement;
    cube.rotation.y += rotationIncrement * 1.5;
  }

  // Update OrbitControls
  controls.update();

  // Performance tracking
  const now = performance.now();
  frameCount++;
  if (now - lastTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastTime));
    statFps.textContent = `${fps} FPS`;
    frameCount = 0;
    lastTime = now;
  }

  // Live diagnostics updates
  statAngle.textContent = `${(cube.rotation.y % (Math.PI * 2)).toFixed(2)} rad`;

  // Render Scene
  renderer.render(scene, camera);
}

// Start animation loop
animate();

// --- RESIZE EVENT ---
function handleResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', handleResize);

// --- UI INTERACTIONS & EVENT BINDINGS ---

// Set Color
function updateColor(colorHex) {
  state.color = colorHex;
  material.color.set(colorHex);
  inputColor.value = colorHex;
  inputColorHexText.textContent = colorHex.toUpperCase();
  
  // Highlight active preset color if it matches
  colorPresets.forEach(preset => {
    if (preset.dataset.color === colorHex) {
      preset.classList.add('active');
    } else {
      preset.classList.remove('active');
    }
  });
}

inputColor.addEventListener('input', (e) => {
  updateColor(e.target.value);
});

colorPresets.forEach(preset => {
  preset.addEventListener('click', () => {
    updateColor(preset.dataset.color);
  });
});

// Set Roughness
inputRoughness.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.roughness = val;
  material.roughness = val;
  labelRoughness.textContent = val.toFixed(2);
  
  // De-highlight preset active if custom changes
  checkAndResetPresetLabel();
});

// Set Metalness
inputMetalness.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.metalness = val;
  material.metalness = val;
  labelMetalness.textContent = val.toFixed(2);
  
  checkAndResetPresetLabel();
});

// Set Rotation Speed
inputSpeed.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.speed = val;
  labelSpeed.textContent = `${val.toFixed(2)}x`;
});

// Set Point Light Power
inputLightIntensity.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.lightIntensity = val;
  pointLight.intensity = val;
  labelLightIntensity.textContent = val.toFixed(2);
});

// Toggle Auto Rotation
inputToggleRotation.addEventListener('change', (e) => {
  state.autoRotate = e.target.checked;
});

// Segmented Control Preset buttons
inputPresetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    inputPresetButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const preset = btn.dataset.preset;
    applyPreset(preset);
  });
});

function applyPreset(preset) {
  state.preset = preset;
  statPreset.textContent = preset.charAt(0).toUpperCase() + preset.slice(1);
  
  switch (preset) {
    case 'standard':
      material.wireframe = false;
      material.transparent = false;
      material.opacity = 1.0;
      
      state.roughness = 0.40;
      state.metalness = 0.20;
      break;
      
    case 'wireframe':
      material.wireframe = true;
      material.transparent = false;
      material.opacity = 1.0;
      // Retain custom roughness & metalness, just enable wireframe
      break;
      
    case 'glass':
      material.wireframe = false;
      material.transparent = true;
      material.opacity = 0.60;
      
      state.roughness = 0.05;
      state.metalness = 0.10;
      break;
      
    case 'metallic':
      material.wireframe = false;
      material.transparent = false;
      material.opacity = 1.0;
      
      state.roughness = 0.15;
      state.metalness = 0.95;
      break;
  }
  
  // Update UI range sliders to match preset if applicable
  if (preset !== 'wireframe') {
    inputRoughness.value = state.roughness;
    labelRoughness.textContent = state.roughness.toFixed(2);
    material.roughness = state.roughness;
    
    inputMetalness.value = state.metalness;
    labelMetalness.textContent = state.metalness.toFixed(2);
    material.metalness = state.metalness;
  } else {
    // If wireframe was activated, make sure it applies to current structure
    material.wireframe = true;
  }
}

// If user modifies sliders, we check if it matches a preset, else update status preset tag to 'Custom'
function checkAndResetPresetLabel() {
  let matchedPreset = 'custom';
  
  if (material.wireframe) {
    matchedPreset = 'wireframe';
  } else if (state.roughness === 0.40 && state.metalness === 0.20 && !material.transparent) {
    matchedPreset = 'standard';
  } else if (state.roughness === 0.05 && state.metalness === 0.10 && material.transparent && material.opacity === 0.60) {
    matchedPreset = 'glass';
  } else if (state.roughness === 0.15 && state.metalness === 0.95 && !material.transparent) {
    matchedPreset = 'metallic';
  }
  
  statPreset.textContent = matchedPreset.charAt(0).toUpperCase() + matchedPreset.slice(1);
  
  // Highlight/remove segment button active state
  inputPresetButtons.forEach(btn => {
    if (btn.dataset.preset === matchedPreset) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Reset System State
btnReset.addEventListener('click', () => {
  state = { ...defaults };
  
  // Reapply material properties
  material.wireframe = false;
  material.transparent = false;
  material.opacity = 1.0;
  material.roughness = state.roughness;
  material.metalness = state.metalness;
  pointLight.intensity = state.lightIntensity;
  
  // Update inputs
  updateColor(state.color);
  
  inputRoughness.value = state.roughness;
  labelRoughness.textContent = state.roughness.toFixed(2);
  
  inputMetalness.value = state.metalness;
  labelMetalness.textContent = state.metalness.toFixed(2);
  
  inputSpeed.value = state.speed;
  labelSpeed.textContent = `${state.speed.toFixed(2)}x`;
  
  inputLightIntensity.value = state.lightIntensity;
  labelLightIntensity.textContent = state.lightIntensity.toFixed(2);
  
  inputToggleRotation.checked = state.autoRotate;
  
  // Apply segment class active standard
  inputPresetButtons.forEach(b => {
    if (b.dataset.preset === 'standard') b.classList.add('active');
    else b.classList.remove('active');
  });
  statPreset.textContent = 'Standard';
  
  // Reset camera view angle
  controls.reset();
});


// --- EDUCATIONAL TABS ENGINE ---
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    // Toggle active state on buttons
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Toggle active state on contents
    tabContents.forEach(content => {
      if (content.id === `content-${tabName}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  });
});
