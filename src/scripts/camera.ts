import {vec3, mat4} from 'gl-matrix'

export class Camera {
  near: number;
  far: number;
  pos: vec3;
  pitch = 0;

  zoom = 5;

  constructor(near: number, far: number) {
    this.near = near;
    this.far = far;
    this.pos = vec3.fromValues(0, 0.3, -0.5);
  }

  view(): mat4 {
    const lookAtMatrix = mat4.lookAt(
      mat4.create(), 
      this.pos, 
      vec3.fromValues(0, 0, 0), 
      vec3.fromValues(0, 1, 0)
    );
    return lookAtMatrix;
  }

  right(): vec3 {
    const viewMatrix = this.view();
    
    return vec3.fromValues(viewMatrix[0], viewMatrix[1], viewMatrix[2]);
  }

  ortho(): mat4 {
    let l = -1 * this.zoom, r = 1 * this.zoom;
    let b = -1 * this.zoom, t = 1 * this.zoom;
    return mat4.ortho(mat4.create(), l, r, b, t, this.near, this.far);
  }
}