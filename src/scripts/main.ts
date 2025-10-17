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

    let uProj = gl.getUniformLocation(shader, "proj");
    let proj = camera.ortho();
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

  function drawPoints(gl: WebGL2RenderingContext, shader: WebGLProgram, points: Point[], camera: Camera) {
    gl.useProgram(shader);

    let uProj = gl.getUniformLocation(shader, "proj");
    let proj = camera.ortho();
    gl.uniformMatrix4fv(uProj, false, proj);

    for (const point of points) {
      let uModel = gl.getUniformLocation(shader, "model");
      gl.uniformMatrix4fv(uModel, false, point.model);

      gl.bindBuffer(gl.ARRAY_BUFFER, point.buf.vbo);

      gl.drawArrays(gl.POINTS, 0, 1);
    }
  }

  gl.enable(gl.DEPTH_TEST)

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

  const camera = new Camera(-1, 1);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.07, 0.07, 0.10, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw planes
  const baseM = mat4.scale(mat4.create(), mat4.identity(mat4.create()), vec3.fromValues(0.5, 0.5, 0.5))
  const quads = [
    new Quad(gl, mat4.rotate(mat4.create(), baseM, 0.8, vec3.fromValues(0, 1, 0)), new Float32Array([0.5, 0.5, 0, 1])),
    new Quad(gl, mat4.rotate(mat4.create(), baseM, -0.8, vec3.fromValues(0, 1, 0)), new Float32Array([0, 0.5, 0.5, 1]))
  ];
  drawPlanes(gl, quadShader, quads, camera);

  // Draw points
  const point = new Point(gl, new Float32Array([0, 0, 1]))
  drawPoints(gl, pointShader, [point], camera);
})();