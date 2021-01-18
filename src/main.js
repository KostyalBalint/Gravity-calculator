import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as Stats from 'stats.js';

import {ThreeView} from './ThreeView.js'
import {VoxelWorld} from './VoxelWorld.js';   //Generates the voxel mesh for ThreeJs
import {Physics} from './physics.js';         //Calculates the gravity
import gravityChart from './createChart.js';
import $ from "jquery";
import * as GUI from './gui.js';              //User interface

var scene, canvas, renderer, camera, controls, stats;

var CONFIG = {
  wordSize: 100,    //The size of the VoxelWorld in the ThreeJs viewer
  cellSize: 16,    //Divide the space for this many unit
  antialias: false,
};

var physics, threeView, world;

GUI.init(CONFIG);

function main() {

  threeView = new ThreeView(CONFIG, document.querySelector('#three-ctx'));
  window.threeView = threeView; //TODO: Temp

  animate();  //Start the animation loop

  threeView.addLight(2*CONFIG.wordSize, 2*CONFIG.wordSize, 2*CONFIG.wordSize);
  threeView.addLight(-2*CONFIG.wordSize, 2*CONFIG.wordSize, -2*CONFIG.wordSize);

  threeView.scene.add( new THREE.AmbientLight( 0x939393 ) );  //Global illumination

  threeView.addCenter();

  world = new VoxelWorld(CONFIG.cellSize, CONFIG.wordSize);
  physics = new Physics(world);
  window.world = world;

  var min = -CONFIG.cellSize / 2;
  var max =  CONFIG.cellSize / 2;


  world.fillWord(min, max, (vector, min, max) => {
    //Sphere geometry
    let sphere = Math.pow(vector.x, 2) +
                 Math.pow(vector.y, 2) +
                 Math.pow(vector.z, 2);
    return sphere < max * max;  //Max is the radius
  });

  world.fillWord(min, max, (vector, min, max) => {
    //Torus geometry
    return Math.pow(Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2)) - max*2/3, 2) + Math.pow(vector.z, 2) < max;
  });


  const voxelObjectGroup = new THREE.Group();
  const {positions, normals, indices} = world.generateGeometryDataForCell(0, 0, 0);
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshLambertMaterial({color: '#bd7b3e', side: THREE.DoubleSide});
  const lineMaterial  = new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.5} );

  const positionNumComponents = 3;
  const normalNumComponents = 3;
  geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
  geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
  geometry.setIndex(indices);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.name = "voxelObjectMaterial";
  voxelObjectGroup.add(mesh);
  var wireframe = new THREE.LineSegments( geometry, lineMaterial );
  wireframe.name = "voxelObjectWireFrame";
  voxelObjectGroup.add(wireframe);

  //Scale and move the generated object, so for every cellSize selected
  //wi will get the same bounds in threeJs (worldSize)
  voxelObjectGroup.applyMatrix4(world.getThreeJsWorldTransformMatrix());
  voxelObjectGroup.name = "voxelObject";

  threeView.scene.add(voxelObjectGroup);
}

main();


/*********************************************************/
/*                                                       */
/*                  Rendering functions                  */
/*   This would look better in the threeView class,      */
/*   but because of requestAnimationFrame( animate )     */
/*   function it's easier to do it Sphere                */
/*********************************************************/

function onWindowResize() {

  threeView.camera.aspect = threeView.canvas.clientWidth / threeView.canvas.clientHeight;
  threeView.camera.updateProjectionMatrix();

  threeView.renderer.setSize( threeView.canvas.clientWidth , threeView.canvas.clientHeight);
  threeView.renderer.setPixelRatio( window.devicePixelRatio );
}

function animate(){
  requestAnimationFrame( animate );

  threeView.controls.update();

  threeView.renderer.render( threeView.scene, threeView.camera );
  threeView.stats.update();

}

$( window ).resize(onWindowResize);

/*              End of rendering functions               */
/*********************************************************/
