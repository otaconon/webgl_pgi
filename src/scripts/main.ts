import {vec3, mat4} from 'gl-matrix'
import {Quad, Point} from './primitives.js'
import {Camera} from './camera.js'
import { loadText, createProgram } from './utils.js';
import { drawPoints, drawTransparentPlanes } from './draw.js';

(async function () {
  'use strict';

  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  if (!gl) throw new Error('WebGL not supported');

  function sortQuadsByDepth(quads: Quad[], camera: Camera): Quad[] {
    const cameraPos = camera.pos;
    
    return quads.slice().sort((a, b) => {
      const centerA = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, 0), a.model);
      const centerB = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, 0), b.model);
      
      const distA = vec3.distance(cameraPos, centerA);
      const distB = vec3.distance(cameraPos, centerB);
      
      return distB - distA;
    });
  }

  const camera = new Camera(-100, 100);

  let mouseX = 0, mouseY = 0;
  let lastX = 0, lastY = 0;
  let dx = 0, dy = 0;
  let rightMouseDown = false;

  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 2) {
      rightMouseDown = true;
      event.preventDefault();
    }
  });

  canvas.addEventListener('mouseup', (event) => {
    if (event.button === 2) {
      rightMouseDown = false;
    }
  });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    vec3.add(camera.pos, camera.pos, vec3.fromValues(0, 0, event.deltaY));
  });

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent right-click context menu
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    const glX = (mouseX / canvas.width) * 2 - 1;
    const glY = -((mouseY / canvas.height) * 2 - 1);

    dx = lastX - glX;
    dy = lastY - glY;
    lastX = glX;
    lastY = glY;

    if (rightMouseDown) {
      const rotationSpeed = 2.0;
      const angleX = dx * rotationSpeed;
      const angleY = dy * rotationSpeed;
      
      vec3.rotateY(camera.pos, camera.pos, vec3.fromValues(0, 0, 0), angleX);
      
      const toCamera = vec3.subtract(vec3.create(), camera.pos, vec3.fromValues(0, 0, 0));
      const right = vec3.cross(vec3.create(), vec3.fromValues(0, 1, 0), toCamera);
      vec3.normalize(right, right);
      
      const rotM = mat4.rotate(mat4.create(), mat4.create(), angleY, right);
      vec3.transformMat4(camera.pos, camera.pos, rotM);
    }
  });

  const [quadVsSource, quadFsSource] = await Promise.all([
    loadText('../shaders/quad.vert.glsl'),
    loadText('../shaders/quad.frag.glsl'),
  ]);
  const quadShader = createProgram(gl, quadVsSource, quadFsSource);

  const [pointVsSource, pointFsSource] = await Promise.all([
    loadText('../shaders/point.vert.glsl'),
    loadText('../shaders/point.frag.glsl'),
  ])
  const pointShader = createProgram(gl, pointVsSource, pointFsSource);

  // Draw planes
  const baseM = mat4.scale(mat4.create(), mat4.identity(mat4.create()), vec3.fromValues(0.5, 0.5, 0.5))
  mat4.translate(baseM, baseM, vec3.fromValues(0, -0.5, 0))
  const quadTransfroms = [
    mat4.translate(mat4.create(), baseM, vec3.fromValues(-1, 0, 0)),
    mat4.translate(mat4.create(), baseM, vec3.fromValues(1, 0, 0)),
    mat4.translate(mat4.create(), baseM, vec3.fromValues(1, 0, 0)),
    mat4.translate(mat4.create(), baseM, vec3.fromValues(-1, 0, 0)),
  ]

  const angle = 0.8;
  const rotationAxis = vec3.fromValues(0, 1, 0);

  let rotationMatrix = mat4.rotate(mat4.create(), mat4.identity(mat4.create()), angle, rotationAxis);
  mat4.multiply(quadTransfroms[0], rotationMatrix, quadTransfroms[0]);
  mat4.multiply(quadTransfroms[1], rotationMatrix, quadTransfroms[1]);

  rotationMatrix = mat4.rotate(mat4.create(), mat4.identity(mat4.create()), -angle, rotationAxis);
  mat4.multiply(quadTransfroms[2], rotationMatrix, quadTransfroms[2]);
  mat4.multiply(quadTransfroms[3], rotationMatrix, quadTransfroms[3]);

  const xyQuadsBaseM = mat4.scale(mat4.create(), mat4.identity(mat4.create()), vec3.fromValues(0.5, 0.5, 0.5));
  mat4.rotate(xyQuadsBaseM, xyQuadsBaseM, 0.8, vec3.fromValues(0, 1, 0))
  mat4.rotate(xyQuadsBaseM, xyQuadsBaseM, 1.57, vec3.fromValues(1, 0, 0))
  const xyQuadsTransfors = [
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(-1, 1, 0.65)),
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(-1, -1, 0.65)),
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(1, 1, 0.65)),
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(1, -1, 0.65)),
  ]

  const quads = [
    new Quad(gl, quadTransfroms[0], new Float32Array([1, 0, 0, 0.5])),
    new Quad(gl, quadTransfroms[1], new Float32Array([1, 0, 0, 0.5])),
    new Quad(gl, quadTransfroms[2], new Float32Array([0, 1, 0, 0.5])),
    new Quad(gl, quadTransfroms[3], new Float32Array([0, 1, 0, 0.5])),
    new Quad(gl, xyQuadsTransfors[0], new Float32Array([1, 1, 1, 0.5])),
    new Quad(gl, xyQuadsTransfors[1], new Float32Array([1, 1, 1, 0.5])),
    new Quad(gl, xyQuadsTransfors[2], new Float32Array([1, 1, 1, 0.5])),
    new Quad(gl, xyQuadsTransfors[3], new Float32Array([1, 1, 1, 0.5])),
  ];

  const point = new Point(gl, new Float32Array([0, 0, 1]))

  gl.enable(gl.DEPTH_TEST)

  function render() {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.07, 0.07, 0.07, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const sortedQuads = sortQuadsByDepth(quads, camera);
    drawTransparentPlanes(gl, quadShader, sortedQuads, camera);

    gl.disable(gl.BLEND);
    drawPoints(gl, pointShader, [point], camera);
    
    requestAnimationFrame(render);
  }

  render();
})();