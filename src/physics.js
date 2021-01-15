import * as THREE from 'three';
import{ initChart } from './createChart.js';

export class Physics{

  constructor(){
    this.mass = 5.9e3;  //Mass of the whole object
    this.voxels = [];

    window.physics = this;
  }

  addVoxel(voxel){
    this.voxels.push(voxel);
  }

  massPerVoxel(){
      return this.mass / this.voxels.length;
  }

  /**
    Calculates the gravitational field strength at a given point in space
    Based on the voxels
  */
  calculateGravitationField(point){
      let field = new THREE.Vector3(0, 0, 0);   //Output field vector
      const G = 6.67430e-11;              //Gravitational constant

      this.voxels.forEach((voxel) => {
          let r = point.distanceToSquared(voxel); //r^2
          if(r == 0) return;

          let g = G * this.massPerVoxel() / r;   // g = G * M / r^2
          field.add(voxel.sub(point).multiplyScalar(g));
      });
      return field;
  }

  /**
    Interpollate between A and B point n times and creates and returns
    an array of gravitational field datas
  */
  interPollateGravityField(A, B, n){
    let array = [];
    for (var i = 1; i < n; i++) {
      let vector = A.lerp(B, i/n);
      console.log(vector, i/n);
      array.push(this.calculateGravitationField(vector).length());
    }
    return array;
  }

  //TODO: temporary here only
  createChart(){
    initChart(this.interPollateGravityField(new THREE.Vector3(0, -100000, 0), new THREE.Vector3(0, 10000, 0), 100));
  }

}
