import { Camera } from "./camera";
import { Point, Quad } from "./primitives";

export function drawTransparentPlanes(gl: WebGL2RenderingContext, shader: WebGLProgram, quads: Quad[], camera: Camera) {
  gl.useProgram(shader);

  // Get attribute location once
  const aPosition = gl.getAttribLocation(shader, "aPosition");
  gl.enableVertexAttribArray(aPosition);

  let uView = gl.getUniformLocation(shader, "view");
  let uProj = gl.getUniformLocation(shader, "proj");

  let view = camera.view();
  let proj = camera.ortho();
  gl.uniformMatrix4fv(uView, false, view);
  gl.uniformMatrix4fv(uProj, false, proj);

  gl.depthMask(false);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE, gl.ONE_MINUS_SRC_ALPHA
  );

  gl.cullFace(gl.FRONT);
  for (const quad of quads) {
    let uModel = gl.getUniformLocation(shader, "model");
    gl.uniformMatrix4fv(uModel, false, quad.model);

    let uColor = gl.getUniformLocation(shader, "color");
    gl.uniform4fv(uColor, quad.color);

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.buf.vbo);
    
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.buf.ibo);

    gl.drawElements(gl.TRIANGLES, quad.buf.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  gl.depthMask(true);
  gl.disable(gl.CULL_FACE);
}

export function drawPoints(gl: WebGL2RenderingContext, shader: WebGLProgram, points: Point[], camera: Camera) {
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