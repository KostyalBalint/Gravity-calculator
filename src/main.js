import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as Stats from 'stats.js';

import {VoxelWorld} from './VoxelWorld.js';
import {Physics} from './physics.js';

var scene, canvas, renderer, camera, controls, stats;

var CONFIG = {
  wordSize: 100,    //The size of the VoxelWorld in the ThreeJs viewer
  cellSize: 128,    //Divide the space for this many unit
  antialias: false,
};

var physics = new Physics();


function main() {
  scene = new THREE.Scene();
  canvas = document.querySelector('#three-ctx');

  renderer = new THREE.WebGLRenderer( { antialias: CONFIG.antialias, canvas } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0x000000, 0);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //Add to window object so three js chrome debugger finds Three js
  window.scene = scene;
  window.THREE = THREE;

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.set(-CONFIG.wordSize, CONFIG.wordSize * 0.8, -CONFIG.wordSize);

  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.1;
  controls.screenSpacePanning = false;
  controls.minDistance = 50;
  controls.maxDistance = 180;
  controls.maxPolarAngle = Math.PI;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;
  controls.enablePan = false;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  }
  controls.update();

  scene.background = new THREE.Color('#e0e0e0');

  addLight(2*CONFIG.wordSize, 2*CONFIG.wordSize, 2*CONFIG.wordSize);
  addLight(-2*CONFIG.wordSize, 2*CONFIG.wordSize, -2*CONFIG.wordSize);

  scene.add( new THREE.AmbientLight( 0x939393 ) );  //Global illumination

  //addGroundPlane();

  const world = new VoxelWorld(CONFIG.cellSize);

  for (let y = 0; y < CONFIG.cellSize; ++y) {
    for (let z = 0; z < CONFIG.cellSize; ++z) {
      for (let x = 0; x < CONFIG.cellSize; ++x) {
        let center = CONFIG.cellSize / 2;
        let sphere = Math.pow(x - center, 2) + Math.pow(y - center, 2) + Math.pow(z - center, 2);
        if(sphere < center * center /*&& sphere > center * center - CONFIG.cellSize*/){
          world.setVoxel(x, y, z, 1);
          physics.addVoxel(new THREE.Vector3(x, y, z).sub(new THREE.Vector3(CONFIG.cellSize / 2, CONFIG.cellSize / 2, CONFIG.cellSize / 2)));
        }
      }
    }
  }
  const sphereGroup = new THREE.Group();
  const {positions, normals, indices} = world.generateGeometryDataForCell(0, 0, 0);
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshLambertMaterial({color: '#bd7b3e'});
  const lineMaterial  = new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.5 } );

  const positionNumComponents = 3;
  const normalNumComponents = 3;
  geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
  geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
  geometry.setIndex(indices);
  sphereGroup.add(new THREE.Mesh(geometry, material));
  sphereGroup.add(new THREE.LineSegments( geometry, lineMaterial ));
  sphereGroup.scale.x = CONFIG.wordSize / (CONFIG.cellSize + 1);
  sphereGroup.scale.y = CONFIG.wordSize / (CONFIG.cellSize + 1);
  sphereGroup.scale.z = CONFIG.wordSize / (CONFIG.cellSize + 1);

  sphereGroup.position.x = -CONFIG.wordSize / 2;
  sphereGroup.position.y = -CONFIG.wordSize / 2;
  sphereGroup.position.z = -CONFIG.wordSize / 2;
  scene.add(sphereGroup);

  controls.addEventListener('change', requestRenderIfNotRequested);
  window.addEventListener('resize', requestRenderIfNotRequested);
}

main();


/**
  Helper functions for the Three Js scene
*/

function addGroundPlane(){
  const group = new THREE.Group();

  //Create a plane that receives shadows (but does not cast them)
  const planeGeometry = new THREE.PlaneBufferGeometry( 100, 100, 10, 10 );
  const planeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } );
  const lineMaterial  = new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.5 } );
  const plane = new THREE.Mesh( planeGeometry, planeMaterial );
  plane.receiveShadow = true;
  group.add(plane); //Add the plane
  group.add(new THREE.LineSegments( planeGeometry, lineMaterial ));      //Add the lines
  group.rotation.x = Math.PI / 2;
  scene.add( group );

  const axesHelper = new THREE.AxesHelper( 20 );
  scene.add( axesHelper );
}


function addLight(x, y, z) {
  const color = 0xFFFFFF;
  const intensity = 0.8;
  const light = new THREE.DirectionalLight(color, intensity);
  light.castShadow = true;
  light.position.set(x, y, z);
  scene.add(light);
}


/**
    Rendering functions
*/

let renderRequested = false;
render();
function requestRenderIfNotRequested() {
  if (!renderRequested) {
    renderRequested = true;
    requestAnimationFrame(render);
  }
}
function render() {
  renderRequested = undefined;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update();
  renderer.render(scene, camera);
  stats.update();
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
