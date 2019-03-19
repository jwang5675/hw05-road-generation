import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

let mapVal: number = 0;

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Show Water': showWater,
  'Show Elevation': showElevation,
  'Show Population Density': showPopulationDensity,
  'Elevation & Pop Density': showElevationAndDensity,
};

function showWater() {
  mapVal = 0;
}

function showElevation() {
  mapVal = 1;
}

function showPopulationDensity() {
  mapVal = 2;
}

function showElevationAndDensity() {
  mapVal = 3;
}

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  let offsetsArray = [];
  let colorsArray = [];
  let n: number = 100.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // grid of "particles"
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Show Water');
  gui.add(controls, 'Show Elevation');
  gui.add(controls, 'Show Population Density');
  gui.add(controls, 'Elevation & Pop Density');


  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.ONE, gl.ONE);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(mapVal);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      //square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  /** Texture Renderer starts here **/
  const texturecanvas = <HTMLCanvasElement> document.getElementById('texturecanvas');
  const textureRenderer = new OpenGLRenderer(texturecanvas);

  const width = 1000;
  const height = 1000;

  textureRenderer.setSize(width, height);
  textureRenderer.setClearColor(0, 0, 1, 1);

  flat.setTime(0);
  let waterData = textureRenderer.renderTexture(camera, flat, [screenQuad]);
  let counter = 0;
  for (let i = 0; i < width * height * 4; i++) {
    if (waterData[i] != 255) {
      counter = counter + 1;
    }
  }
  counter = counter / (width * height * 4);
  console.log("Water data: " + counter);

  flat.setTime(1);
  let elevationData = textureRenderer.renderTexture(camera, flat, [screenQuad]);
  counter = 0;
  for (let i = 0; i < width * height * 4; i++) {
    if (elevationData[i] != 255) {
      counter = counter + 1;
    }
  }
  counter = counter / (width * height * 4);
  console.log("Elevation data: " + counter);

  flat.setTime(2);
  let populationData = textureRenderer.renderTexture(camera, flat, [screenQuad]);
  counter = 0;
  for (let i = 0; i < width * height * 4; i++) {
    if (populationData[i] != 255) {
      counter = counter + 1;
    }
  }
  counter = counter / (width * height * 4);
  console.log("Population data: " + counter);
  /** Texture Renderer ends here **/

  // Start the render loop
  tick();
}

main();
