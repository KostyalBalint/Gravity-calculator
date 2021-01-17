import * as THREE from 'three';
import{ initChart } from './createChart.js';

export class Physics{

  constructor(voxelWorld){
    this.mass = 5.9e24;  //Mass of the whole object, it's around the earth mass
    this.voxelWorlds = voxelWorld;

    window.physics = this;
  }
/*
  addVoxel(voxel){
    this.voxels.push(voxel);
  }*/

  massPerVoxel(){
      return this.mass / this.voxelWorlds.voxelCount;
  }

  /**
    Calculates the gravitational field strength at a given point in space
    Based on the voxels
  */
  calculateGravitationField(point){
      let field = new THREE.Vector3(0, 0, 0);   //Output field vector
      const G = 6.67430e-11;              //Gravitational constant

      for (let x = 0; x < this.voxelWorlds.cellSize; x++) {
          for (let y = 0; y < this.voxelWorlds.cellSize; y++) {
              for (let z = 0; z < this.voxelWorlds.cellSize; z++) {
                  if(this.voxelWorlds.getVoxel(x, y, z) === 1){  //We have a voxel at this coordinate
                      var voxel = new THREE.Vector3(x+0.5, y+0.5, z+0.5);

                      let r = point.distanceToSquared(voxel.clone()); //r^2
                      if(r == 0) { continue; }

                      let g = G * this.massPerVoxel() / r;   // g = G * M / r^2

                      field.add(voxel.sub(point).multiplyScalar(g));

                  }
              }
          }
      }
      return field;
  }

  /**
    Interpollate between A and B point n times and creates and returns
    an array of gravitational field datas
  */
  interPollateGravityField(A, B, n){
    let array = [];
    for (var i = 1; i < n; i++) {
      //let vector = A.lerp(B, i/n);
      let vector = this.getPointInBetweenByPerc(A, B, i/n);

      window.threeView.addPoint(vector.x, vector.y, vector.z, 0xff0000);    //Red
      vector.applyMatrix4(this.voxelWorlds.getThreeJsWorldTransformMatrix().invert());

      console.log(vector, i/n);
      array.push(this.calculateGravitationField(vector).length());
    }
    return array;
  }

  //Interpollate between A and B vectors at precentage
  //pos is between 0 and 1
  getPointInBetweenByPerc(pointA, pointB, percentage) {
    var dir = pointB.clone().sub(pointA);
    var len = dir.length();
    dir = dir.normalize().multiplyScalar(len*percentage);
    return pointA.clone().add(dir);
  }

  //TODO: temporary here only
  createChart(){
    initChart(this.interPollateGravityField(new THREE.Vector3(-100, 0, 0), new THREE.Vector3(100, 0, 0), 100));
  }

}
