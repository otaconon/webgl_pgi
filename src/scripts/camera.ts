import {vec3, mat4} from 'gl-matrix'

export class Camera {
  near: number;
  far: number;
  pos: vec3;

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
    const inverted = mat4.create();
    mat4.invert(inverted, lookAtMatrix);
    return inverted;
  }

  ortho(): mat4 {
    let l = -1, r = 1;
    let b = -1, t = 1;
    return mat4.ortho(mat4.create(), l, r, b, t, this.near, this.far);
  }
}