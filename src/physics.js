import * as THREE from 'three';
import gravityChart from './createChart.js';

export class Physics{

  constructor(voxelWorld){
    this.mass = 5.9e24;       //Mass of the whole object, it's around the earth mass
    this.diameter = 12742000; //Diameter of the earth in meters
    this.voxelWorld = voxelWorld;

    window.physics = this;
  }
/*
  addVoxel(voxel){
    this.voxels.push(voxel);
  }*/

  massPerVoxel(){
      return this.mass / this.voxelWorld.voxelCount;
  }

  /**
    Calculates the gravitational field strength for an array of points
    Based on the voxels
  */
  calculateGravitationField(gravitys){
      //let field = new THREE.Vector3(0, 0, 0);   //Output field vector
      const G = 6.67430e-11;              //Gravitational constant

      /*gravitys.forEach(x => {
        let vector = x.point;
        let sphere = window.threeView.createPoint(vector.x, vector.y, vector.z, 0x0000ff);
        window.threeView.scene.add(sphere);
        //console.log(vector);
      });*/

      let t0 = performance.now();
      for (let x = 0; x < this.voxelWorld.cellSize; x++) {
          for (let y = 0; y < this.voxelWorld.cellSize; y++) {
              for (let z = 0; z < this.voxelWorld.cellSize; z++) {
                  if(this.voxelWorld.getVoxel(x, y, z) === 1){  //We have a voxel at this coordinate
                      //Add 0.5 to voxel so we calculate to the center of the voxel
                      gravitys.map((data) => {
                        var voxel = new THREE.Vector3(x+0.5, y+0.5, z+0.5);
                        var r = data.point.distanceToSquared(voxel); //r^2

                        //Compensate vector units to meters according to the earh size
                        r *= (this.diameter * this.diameter) / (this.voxelWorld.cellSize * this.voxelWorld.cellSize);

                        var g = G * this.massPerVoxel() / r;   // g = G * M / r^2

                        data.gravity.add(voxel.sub(data.point).normalize().multiplyScalar(g));
                        return data;
                      });
                  }
              }
          }
      }

      let t1 = performance.now();
      console.log("Calculate 1 point gravity took: " + (t1 - t0) / gravitys.length + " ms");
      return gravitys;
      //return field;
  }

  /**
    Interpollate between A and B point n times and creates and returns
    an array of gravitational field datas
  */
  interPollateGravityField(A, B, n, updateProgressBar){
    let gravitys = [];  //The calculated gravity values and points, to which we need gravity values

    var chartPointGroup = new THREE.Group();
    chartPointGroup.name = "chartPoints";

    for (var i = 1; i <= n; i++) {
      //let vector = A.lerp(B, i/n);
      let vector = this.getPointInBetweenByPerc(A, B, i/n);

      chartPointGroup.add(window.threeView.createPoint(vector.x, vector.y, vector.z, 0xd64545));

      //Translate the given threeJs Vector to the VoxelWorld space
      vector.applyMatrix4(this.voxelWorld.getThreeJsWorldTransformMatrix().invert());

      //updateProgressBar(Math.round((i/n * 100)));

      //Point: to this point we calculate the gravity value
      //Gravity: calculated gravity vector
      gravitys.push({point: vector, gravity: new THREE.Vector3(0, 0, 0)});
    }

    gravitys = this.calculateGravitationField(gravitys);

    var distanceScale = this.diameter / this.voxelWorld.cellSize;
    let center = new THREE.Vector3(0, 0, 0);    //Center to which the distance is measured in the chart
    center.applyMatrix4(this.voxelWorld.getThreeJsWorldTransformMatrix().invert());


    gravitys.map((data) => {
      data.distance = data.point.distanceTo(center) * distanceScale;
      return data;
    });

    window.scene.add(chartPointGroup);

    return gravitys;
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
  updateChart(updateProgressBar){
    let start  = new THREE.Vector3(0, 0, -150); //Start of the interpollation
    let end    = new THREE.Vector3(0, 0, 150);  //End of the interpollation
    let center = new THREE.Vector3(0, 0, 0);    //Center to which the distance is measured in the chart
    center.applyMatrix4(this.voxelWorld.getThreeJsWorldTransformMatrix().invert());
    let t0 = performance.now();
    let data = this.interPollateGravityField(start, end, 400, updateProgressBar);
    let t1 = performance.now();
    console.log("interPollateGravityField took: " + (t1 - t0) + " ms");
    let labels = data.map(x => x.distance / 1000 );
    data = data.map(x => x.gravity.length() );
    gravityChart.updateChart({labels, data});
  }

}
