import * as THREE from 'three';
import { GPU } from 'gpu.js';
import gravityChart from './createChart.js';

export class Physics{

  constructor(){
    this.mass = 5.9e24;       //Mass of the whole object, it's around the earth mass
    this.diameter = 12742000; //Diameter of the earth in meters

    this.gpu = new GPU(); //GPU instance to calculate gravity paralell

    window.physics = this;

    this.directions = {
      x: {
        name: "X axis",
        color: "#d64545", // Red
        start: new THREE.Vector3( 150, 0, 0),
        end:   new THREE.Vector3(-150, 0, 0)
      },
      y: {
        name: "Y axis",
        color: "#45d645", // Green
        start: new THREE.Vector3(0,  150, 0),
        end:   new THREE.Vector3(0, -150, 0)
      },
      z: {
        name: "Z axis",
        color: "#4590d6", // Blue
        start: new THREE.Vector3(0, 0, 150),
        end:   new THREE.Vector3(0, 0, -150)
      },
    }
  }

  massPerVoxel(){
      return this.mass / window.world.voxelCount;
  }

  /**
    Get every point from the VoxelWord, so we can calculate gravity for every on of them
  */
  getVoxelGeometryPoints(){
    let t0 = performance.now();
    let geometryPoints = [];

    for (let x = 0; x < window.world.cellSize; x++) {
        for (let y = 0; y < window.world.cellSize; y++) {
            for (let z = 0; z < window.world.cellSize; z++) {
                if(window.world.getVoxel(x, y, z) === 1){  //We have a voxel at this coordinate
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
      let radiusCompensate = (this.diameter * this.diameter) / (window.world.cellSize * window.world.cellSize);
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
  interPollateGravityField(A, B, n, color){
    let measuringPoints = [];  //The points to which we calculate gravity value

    //Remove the previos point group if any
    window.threeView.removeGroupByName("chartPoints");

    var chartPointGroup = new THREE.Group();
    chartPointGroup.name = "chartPoints";

    for (var i = 1; i <= n; i++) {
      //let vector = A.lerp(B, i/n);
      let vector = this.getPointInBetweenByPerc(A, B, i/n);

      chartPointGroup.add(window.threeView.createPoint(vector.x, vector.y, vector.z, color));

      //Translate the given threeJs Vector to the VoxelWorld space
      vector.applyMatrix4(window.world.getThreeJsWorldTransformMatrix().invert());

      measuringPoints.push([vector.x, vector.y, vector.z]);
    }

    var gravitys = this.calculateGravitationField(measuringPoints);

    var distanceScale = this.diameter / window.world.cellSize;
    var center = new THREE.Vector3(0, 0, 0);    //Center to which the distance is measured in the chart
    center.applyMatrix4(window.world.getThreeJsWorldTransformMatrix().invert());

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
    let chartAxis = $("input[name='chartRadio']:checked").data('axis');
    let start = this.directions[chartAxis].start; //Start of the interpollation
    let end   = this.directions[chartAxis].end;   //End of the interpollation
    let direction = this.directions[chartAxis];
    let data = this.interPollateGravityField(start, end, 500, direction.color);
    let labels = data.map(x => x.distanceToCenter / 1000 );
    data = data.map(x => x.gravity.length() );
    gravityChart.updateChart({labels, data}, direction);
  }

  generateThreeDGravity(){
    let measuringPoints = [];  //The points to which we calculate gravity value

    let min = -100; //Coordinate min in THREE JS coordinate system
    let max = 100;  //Coordinate max in THREE JS coordinate system
    let pointCountPerAxis = 11;
    let gravityVectorMaxLength = 10;  //Length of the longest gravity vector

    let increment = Math.round((max - min) / pointCountPerAxis);
    for (let x = min; x < max; x += increment) {
        for (let y = min; y < max; y += increment) {
            for (let z = min; z < max; z += increment) {
              let vector = new THREE.Vector3(x, y, z);
              //Translate the given threeJs Vector to the VoxelWorld space
              vector.applyMatrix4(window.world.getThreeJsWorldTransformMatrix().invert());
              measuringPoints.push([vector.x, vector.y, vector.z]);
            }
        }
    }
    //Calculate the gravity for every point
    var gravitys = this.calculateGravitationField(measuringPoints);

    var longestGravityVector = new THREE.Vector3(0, 0, 0);

    //Translate the gravity points back to THREE Js coordinate system
    gravitys.map((gravity) => {
      //Get the longest gravity vector, so we can map the length and colors according to it
      if(gravity.gravity.lengthSq() > longestGravityVector.lengthSq()){
        longestGravityVector = gravity.gravity;
      }
      gravity.point.applyMatrix4(window.world.getThreeJsWorldTransformMatrix());
      return gravity;
    });

    //Map every gravity vectors length between 0 and gravityVectorMaxLength
    var longestLength = longestGravityVector.length();
    gravitys.map((gravity) => {
      gravity.gravity.divideScalar(longestLength).multiplyScalar(gravityVectorMaxLength);
    });

    //Remove the previos point group if any
    window.threeView.removeGroupByName("gravityVectors");

    var gravityPointGroup = new THREE.Group();
    gravityPointGroup.name = "gravityVectors";

    gravitys.forEach((gravity) => {
      gravityPointGroup.add(window.threeView.createArrow(gravity.point, gravity.gravity, gravityVectorMaxLength));
    });
    window.scene.add(gravityPointGroup);

  }

}
