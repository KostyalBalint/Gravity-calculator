import * as THREE from 'three';

export class Physics{

  constructor(){
    this.mass = 5.9e27;  //Mass of the whole object
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
    let step = A.distanceTo(B) / n;
    let array = [];
    for (var i = 0; i < n; i++) {
      let vector = A.sub(B).multiplyScalar(step * i);
      array.push(this.calculateGravitationField(vector).length());
    }
    return array;
  }

}
