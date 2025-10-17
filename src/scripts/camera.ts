import {vec3, mat4} from 'gl-matrix'

export class Camera {
  near: number;
  far: number;

  constructor(near: number, far: number) {
    this.near = near;
    this.far = far;
  }

  ortho(): mat4 {
    let l = -1, r = 1;
    let b = -1, t = 1;
    return mat4.ortho(mat4.create(), l, r, b, t, this.near, this.far);
  }
}