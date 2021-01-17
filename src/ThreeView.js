import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as Stats from 'stats.js';


export class ThreeView{

  //scene, canvas, renderer, camera, controls, stats

  constructor(CONFIG, canvas){
    this.canvas = canvas;
    this.CONFIG = CONFIG;

    this.scene = new THREE.Scene();   //Create Three Js scene

    this.initRenderer();              //Initialize the renderer

    this.stats = new Stats();              //Initialize the FPS viewer
    document.body.appendChild(this.stats.dom);

    window.scene = this.scene;        //Add to window object so three js chrome debugger finds Three js
    window.THREE = THREE;

    this.initCamera();                //Initialize the camera

    this.initControls();              //Initialize the contorls

    this.scene.background = new THREE.Color('#e0e0e0');

  }

  /*********************************************************/
  /*                   Initialize section                  */
  /*                                                       */
  /*********************************************************/

  initRenderer(){
      this.renderer = new THREE.WebGLRenderer( { antialias: this.CONFIG.antialias, canvas: this.canvas } );
      this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.setSize(this.canvas.clientWidth , this.canvas.clientHeight );
      this.renderer.setClearColor(0x000000, 0);
  }

  initCamera(){
      //TODO: Camera size based on canvas size, not window
      this.camera = new THREE.PerspectiveCamera( 45, this.canvas.clientWidth / this.canvas.clientHeight, 1, 2000 );
      this.camera.position.set(this.CONFIG.wordSize * 1.2, this.CONFIG.wordSize * 0.8, this.CONFIG.wordSize * 1.2);
  }

  initControls(){
      this.controls = new OrbitControls(this.camera, this.canvas);
      this.controls.target.set(0, 0, 0);
      this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      this.controls.dampingFactor = 0.1;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 30;
      this.controls.maxDistance = 250;
      this.controls.maxPolarAngle = Math.PI;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 1.5;
      this.controls.enablePan = false;
      //this.controls.enableZoom = false;     //Disable zooom so scrolling will work
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }
      this.controls.update();
  }

  /*                   End of Initialize                   */
  /*********************************************************/

  /*********************************************************/
  /*                   Helper functions                    */
  /*                                                       */
  /*********************************************************/


  addGroundPlane(){
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
    this.scene.add( group );

  }

  addCenter(){
    this.scene.add( new THREE.AxesHelper( 20 ) );
  }


  addLight(x, y, z) {
    const color = 0xFFFFFF;
    const intensity = 0.8;
    const light = new THREE.DirectionalLight(color, intensity);
    light.castShadow = true;
    light.position.set(x, y, z);
    this.scene.add(light);
  }

  createPoint(x, y, z, color = 0xff0000 ){
    const geometry = new THREE.SphereGeometry( 1, 8, 8 );
    const material = new THREE.MeshBasicMaterial( {color} );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(x, y, z);
    return sphere;
  }

  /*                End of helper functions                */
  /*********************************************************/

}
