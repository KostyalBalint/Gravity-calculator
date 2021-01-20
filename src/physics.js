import * as THREE from 'three';
import { GPU } from 'gpu.js';
import gravityChart from './createChart.js';

export class Physics{

  constructor(voxelWorld){
    this.mass = 5.9e24;       //Mass of the whole object, it's around the earth mass
    this.diameter = 12742000; //Diameter of the earth in meters
    this.voxelWorld = voxelWorld;

    this.gpu = new GPU(); //GPU instance to calculate gravity paralell

    window.physics = this;
  }

  massPerVoxel(){
      return this.mass / this.voxelWorld.voxelCount;
  }

  /**
    Get every point from the VoxelWord, so we can calculate gravity for every on of them
  */
  getVoxelGeometryPoints(){
    let t0 = performance.now();
    let geometryPoints = [];

    for (let x = 0; x < this.voxelWorld.cellSize; x++) {
        for (let y = 0; y < this.voxelWorld.cellSize; y++) {
            for (let z = 0; z < this.voxelWorld.cellSize; z++) {
                if(this.voxelWorld.getVoxel(x, y, z) === 1){  //We have a voxel at this coordinate
                  //Add 0.5 to voxel so we calculate to the center of the voxel
                  geometryPoints.push([x+0.5, y+0.5, z+0.5]);
                  //geometryPoints.push(new THREE.Vector3(x+0.5, y+0.5, z+0.5));
                }
            }
        }
    }
    console.log(" - Generating voxel point array took: " + (performance.now() - t0).toFixed(2) + " ms");

    return geometryPoints;
  }

  /**
    Calculates the gravitational field strength for an array of points
    Based on the voxels
  */
  calculateGravitationField(measuringPoints){
      let t0 = performance.now();         //Start of the calculation, for benchmarking
      const G = 6.67430e-11;              //Gravitational constant
      //Compensate vector units to meters according to the earh size
      let radiusCompensate = (this.diameter * this.diameter) / (this.voxelWorld.cellSize * this.voxelWorld.cellSize);
      let gravityHelper = G * this.massPerVoxel();

      var voxelPoints = this.getVoxelGeometryPoints();

      const calculateGravity = this.createGravityGPUFunction(measuringPoints, voxelPoints, radiusCompensate, gravityHelper);

       /*-----------------------------------------------*
        |   This function is implemented to run on GPU  |
        |   Parallelize by th gravitys array            |
        *-----------------------------------------------*
      gravitys.map((data) => {
        voxelPoints.forEach((voxel) => {
          var r = data.point.distanceToSquared(voxel) * radiusCompensate; //r^2

          var g =  gravityHelper / r;   // g = G * M / r^2

          data.gravity.add(voxel.clone().sub(data.point).normalize().multiplyScalar(g));
        });
        return data;
      });*/

      let t0GPU = performance.now();
      var gravitysRaw =  calculateGravity(voxelPoints, measuringPoints);
      console.log(" - Gravity calculation GPU part took: " + (performance.now() - t0GPU).toFixed(2) + " ms");
      let gravitys = [];
      for (var i = 0; i < measuringPoints.length; i++) {
        gravitys.push({
              gravity : (new THREE.Vector3(gravitysRaw[i][0], gravitysRaw[i][1], gravitysRaw[i][2])),
              point: (new THREE.Vector3(measuringPoints[i][0], measuringPoints[i][1], measuringPoints[i][2]))
            });
      }

      console.log("Total gravity calculation took: " + (performance.now() - t0).toFixed(2) + " ms");
      return gravitys;
  }

  createGravityGPUFunction(measuringPoints, voxelPoints, radiusCompensate, gravityHelper){
      const calculateGravity = this.gpu.createKernel(function(voxelPoints, measuringPoints){
      var gravityX = 0, gravityY = 0, gravityZ = 0;

      for (var i = 0; i < this.constants.voxelLength; i++) {
        //Calculate r^2 (distanceToSquared function)
        var dx = voxelPoints[i][0] - measuringPoints[this.thread.x][0];
        var dy = voxelPoints[i][1] - measuringPoints[this.thread.x][1];
        var dz = voxelPoints[i][2] - measuringPoints[this.thread.x][2];
        var r = (dx*dx + dy*dy + dz*dz) * this.constants.radiusCompensate;

        //Calculate g scalar, and compensate r^2 to earth size
        var g = this.constants.gravityHelper / r; // g = G * M / r^2

        //Normalize the radius vector and multiply by the 'g' scalar
        var len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        dx = (dx / len) * g;
        dy = (dy / len) * g;
        dz = (dz / len) * g;

        //Add this voxel gravity vector to the total gravity vector
        gravityX += dx;
        gravityY += dy;
        gravityZ += dz;
      }

      return [gravityX, gravityY, gravityZ];
    }, {
      constants: {
                    voxelLength: voxelPoints.length,
                    radiusCompensate,
                    gravityHelper
                  },
      output: [measuringPoints.length],
    });
    return calculateGravity;
  }

  /**
    Interpollate between A and B point n times and creates and returns
    an array of gravitational field datas
  */
  interPollateGravityField(A, B, n){
    let measuringPoints = [];  //The points to which we calculate gravity value

    var chartPointGroup = new THREE.Group();
    chartPointGroup.name = "chartPoints";

    for (var i = 1; i <= n; i++) {
      //let vector = A.lerp(B, i/n);
      let vector = this.getPointInBetweenByPerc(A, B, i/n);

      chartPointGroup.add(window.threeView.createPoint(vector.x, vector.y, vector.z, 0xd64545));

      //Translate the given threeJs Vector to the VoxelWorld space
      vector.applyMatrix4(this.voxelWorld.getThreeJsWorldTransformMatrix().invert());

      measuringPoints.push([vector.x, vector.y, vector.z]);
    }

    var gravitys = this.calculateGravitationField(measuringPoints);

    var distanceScale = this.diameter / this.voxelWorld.cellSize;
    var center = new THREE.Vector3(0, 0, 0);    //Center to which the distance is measured in the chart
    center.applyMatrix4(this.voxelWorld.getThreeJsWorldTransformMatrix().invert());

    gravitys.map((data) => {
      data.distanceToCenter = data.point.distanceTo(center) * distanceScale;
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
  updateChart(){
    let start  = new THREE.Vector3(0, 0, -150); //Start of the interpollation
    let end    = new THREE.Vector3(0, 0, 150);  //End of the interpollation
    let data = this.interPollateGravityField(start, end, 500);
    let labels = data.map(x => x.distanceToCenter / 1000 );
    data = data.map(x => x.gravity.length() );
    gravityChart.updateChart({labels, data});
  }

}
