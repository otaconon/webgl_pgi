import {vec3, mat4} from 'gl-matrix'
import {create_point, initCube, Quad, Point} from './primitives.js'
import {Camera} from './camera.js'

(async function () {
  'use strict';

  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  if (!gl) throw new Error('WebGL not supported');

  async function loadText(url: RequestInfo) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
    return await res.text();
  }

  function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const sh = gl.createShader(type);

    if (!sh) {
      throw new Error('Failed to create vertex shader');
    }

    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(`Shader compile error: ${log}`);
    }
    return sh;
  }

  function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(`Program link error: ${log}`);
    }
    return prog;
  }

  function drawPlanes(gl: WebGL2RenderingContext, shader: WebGLProgram, quads: Quad[], camera: Camera) {
    gl.useProgram(shader);

    let uView = gl.getUniformLocation(shader, "view");
    let uProj = gl.getUniformLocation(shader, "proj");

    let view = camera.view();
    let proj = camera.ortho();
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProj, false, proj);

    for (const quad of quads) {
      let uModel = gl.getUniformLocation(shader, "model");
      gl.uniformMatrix4fv(uModel, false, quad.model);

      let uColor = gl.getUniformLocation(shader, "color");
      gl.uniform4fv(uColor, quad.color);

      gl.bindBuffer(gl.ARRAY_BUFFER, quad.buf.vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.buf.ibo);

      gl.drawElements(gl.TRIANGLES, quad.buf.indexCount, gl.UNSIGNED_SHORT, 0);
    }
  }

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

  function drawTransparentPlanes(gl: WebGL2RenderingContext, shader: WebGLProgram, quads: Quad[], camera: Camera) {
    gl.useProgram(shader);

    let uView = gl.getUniformLocation(shader, "view");
    let uProj = gl.getUniformLocation(shader, "proj");

    let view = camera.view();
    let proj = camera.ortho();
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProj, false, proj);

    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,  // RGB
      gl.ONE, gl.ONE_MINUS_SRC_ALPHA         // Alpha
    );

    gl.cullFace(gl.FRONT);
    for (const quad of quads) {
      let uModel = gl.getUniformLocation(shader, "model");
      gl.uniformMatrix4fv(uModel, false, quad.model);

      let uColor = gl.getUniformLocation(shader, "color");
      gl.uniform4fv(uColor, quad.color);

      gl.bindBuffer(gl.ARRAY_BUFFER, quad.buf.vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.buf.ibo);

      gl.drawElements(gl.TRIANGLES, quad.buf.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    gl.depthMask(true);
    gl.disable(gl.CULL_FACE);
  }

  function drawPoints(gl: WebGL2RenderingContext, shader: WebGLProgram, points: Point[], camera: Camera) {
    gl.useProgram(shader);

    let uView = gl.getUniformLocation(shader, "view");
    let uProj = gl.getUniformLocation(shader, "proj");

    let view = camera.view();
    let proj = camera.ortho();
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProj, false, proj);

    for (const point of points) {
      let uModel = gl.getUniformLocation(shader, "model");
      gl.uniformMatrix4fv(uModel, false, point.model);

      gl.bindBuffer(gl.ARRAY_BUFFER, point.buf.vbo);

      gl.drawArrays(gl.POINTS, 0, 1);
    }
  }

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)

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

  const camera = new Camera(-10, 10);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.07, 0.07, 0.07, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(0, 0, 0.65)),
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(0, -2, 0.65)),
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(2, 0, 0.65)),
    mat4.translate(mat4.create(), xyQuadsBaseM, vec3.fromValues(2, -2, 0.65)),
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

  //mat4.translate(xyQuad, xyQuad, vec3.fromValues(0, 0, 0.65));


  const sortedQuads = sortQuadsByDepth(quads, camera);
  drawTransparentPlanes(gl, quadShader, sortedQuads, camera);

  // Draw points
  gl.disable(gl.BLEND)
  const point = new Point(gl, new Float32Array([0, 0, 1]))
  drawPoints(gl, pointShader, [point], camera);
})();