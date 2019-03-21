import {vec3, mat4, quat} from 'gl-matrix';
import Point from '../lsystem/Point';
import Edge from '../lsystem/Edge';
import TextureUtil from '../lsystem/TextureUtil';


export default class HighwayTurtle {
  position: Point;
  forward: vec3 = vec3.create();
  rotationFlag: boolean;
  waterFlag: boolean;
  
  textureUtil: TextureUtil;
  points: Point[];
  edges: Edge[];

  constructor(point: Point, dir: vec3, rotationFlag: boolean, waterFlag: boolean, 
              textureUtil: TextureUtil, points: Point[], edges: Edge[]) {
    this.position = point;
    this.forward = vec3.fromValues(dir[0], dir[1], dir[2]);
    vec3.normalize(this.forward, this.forward);
    this.rotationFlag = rotationFlag;
    this.waterFlag = waterFlag;
    this.textureUtil = textureUtil;
    this.points = points;
    this.edges = edges;
  }

  // Simple Local Constraint, check if out of bounds or in water
  localConstraints(startPoint: Point, endPoint: Point) {
    if (startPoint.position[0] < 0 || startPoint.position[0] > 2000 ||
        startPoint.position[2] < 0 || startPoint.position[2] > 2000) {
      return false;
    }

    if (this.waterFlag) {
      return true;
    }

    let x = endPoint.position[0];
    let y = endPoint.position[2];

    // Rotate for map bound at most 360 degrees;
    let angle = this.rotationFlag ? -10 * Math.PI / 180 : 10 * Math.PI / 180;
    let maxSteps = 36;
    let counter = 0;

    // Check for water itersection, rotate the point until it does not hit water
    while (this.textureUtil.getWater(x, y) == 0) {
      vec3.rotateY(endPoint.position, endPoint.position, startPoint.position, angle);
      x = endPoint.position[0];
      y = endPoint.position[2];
      counter = counter + 1;
      if (counter == maxSteps) {
        return false;
      }
    }

    return true;
  }

  // Simple Global Constraint by population density
  globalGoals(expandedPoint: Point) {
    let x = expandedPoint.position[0];
    let y = expandedPoint.position[2];
    let populationDensity = this.textureUtil.getPopulation(x, y);

    if (populationDensity > 0.2) {
      let xpos = expandedPoint.position[0] + 70 * this.forward[0];
      let ypos = expandedPoint.position[1] + 70 * this.forward[1];
      let zpos = expandedPoint.position[2] + 70 * this.forward[2];
      expandedPoint.position = vec3.fromValues(xpos, ypos, zpos);
    } else {
      let xpos = expandedPoint.position[0] + 70 * this.forward[0];
      let ypos = expandedPoint.position[1] + 70 * this.forward[1];
      let zpos = expandedPoint.position[2] + 70 * this.forward[2];
      expandedPoint.position = vec3.fromValues(xpos, ypos, zpos);
    }
  }

  // Simple expansion rule, expands the turtle by moving forward
  expansionRule() {
    let x = this.position.position[0];
    let y = this.position.position[1];
    let z = this.position.position[2];
    return new Point(vec3.fromValues(x, y, z));
  }

  createNextTurtle(newPoint: Point) {
    return new HighwayTurtle(newPoint, this.forward, this.rotationFlag, this.waterFlag,
                             this.textureUtil, this.points, this.edges);
  }

  simulate() {
    let simulationFlag = true;
    let maxIterations = 100;
    let counter = 0;

    // Get the expanded point from expansion rules
    let expandedPoint = this.expansionRule();

    // Modified the point given the global goals
    this.globalGoals(expandedPoint);

    // Test the point on local constraints
    let result = this.localConstraints(this.position, expandedPoint);

    // If successful, make a new edge and add it to the edges map, returning turtle result
    if (result) {
      let newEdge = new Edge(this.position, expandedPoint, true);
      this.points.push(expandedPoint);
      this.edges.push(newEdge);
      return this.createNextTurtle(expandedPoint);
    } else {
      return null;
    }
  }
}