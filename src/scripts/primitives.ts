import { mat4, vec3, vec4 } from "gl-matrix";

class GlBuffers {
    vbo: WebGLBuffer;
    ibo: WebGLBuffer;
    vOffset = 0;
    nOffset = 0;
    cOffset = 0;
    indexCount = 0;
    vertices = new Float32Array();

    constructor(gl: WebGL2RenderingContext) {
        this.vbo = gl.createBuffer();
        this.ibo = gl.createBuffer();
    }
}

export class Point {
    buf: GlBuffers;
    model: mat4;

    constructor(gl: WebGL2RenderingContext, pos: Float32Array) {
        this.buf = create_point(gl, pos);
        this.model = mat4.identity(mat4.create());
        mat4.scale(this.model, this.model, vec3.fromValues(0.5, 0.5, 0.5));
        mat4.translate(this.model, this.model, vec3.fromValues(pos[0], pos[1], pos[2]))
    }
}

export class Quad {
    buf: GlBuffers;
    model: mat4;
    color: Float32Array;

    constructor(gl: WebGL2RenderingContext, model: mat4, color: Float32Array) {
        this.buf = create_quad(gl);
        this.model = model;
        this.color = color;
    }

    getNormal(): vec3 {
        let a = vec4.transformMat4(vec4.create(), vec4.fromValues(1, -1, 0, 1), this.model);
        let b = vec4.transformMat4(vec4.create(), vec4.fromValues(-1, -1, 0, 1), this.model);
        let c = vec4.transformMat4(vec4.create(), vec4.fromValues(-1, 1, 0, 1), this.model);

        let u = vec3.sub(vec3.create(), b, a);
        let v = vec3.sub(vec3.create(), b, c);
        
        let n = vec3.cross(vec3.create(), u, v);
        vec3.scale(n, n, 1/vec3.len(n));

        return n;
    }
}


export function create_point(gl:WebGL2RenderingContext, pos: Float32Array): GlBuffers {
    const buf = new GlBuffers(gl);

    buf.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbo);

    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);

    // Link buffer to shader attribute
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    return buf
}

export function create_quad(gl:WebGL2RenderingContext): GlBuffers {
    // quad ///////////////////////////////////////////////////////////////////
    //  v1------v0
    //  |       |
    //  |       |
    //  |       |
    //  v2------v3    

    const vertices = new Float32Array([
        1,1,0, -1,1,0,
        -1,-1,0, 1,-1,0,
    ]);

    const indices = new Uint16Array([
        0, 1, 2, 2, 3, 0
    ]);

    let buf = new GlBuffers(gl);
    
    buf.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    buf.vOffset = 0;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, buf.vOffset);
    
    buf.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    buf.indexCount = indices.length;
    
    return buf;
}

export function initCube(gl: WebGL2RenderingContext): GlBuffers {
    // cube ///////////////////////////////////////////////////////////////////
    //    v5------v4  Using GL_TRIANGLES per side
    //   /|      /|   
    //  v1------v0|   
    //  | |     | |   
    //  | |v6---|-|v7 
    //  |/      |/    
    //  v2------v3    

    const xyPlaneColor = new Float32Array([0.208, 0.216, 0.294, 1])
    const xzPlaneColor = new Float32Array([0.314, 0.447, 0.482, 1])
    const yzPlaneColor = new Float32Array([0.471, 0.627, 0.514, 1])

    // vertex position array
    const vertices = new Float32Array([
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,    // v0-v1-v2-v3
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,    // v0-v3-v7-v4
        1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,    // v0-v4-v5-v1
        -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,    // v1-v5-v6-v2
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,    // v6-v7-v3-v2
        -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1     // v5-v4-v7-v6
    ]);

    // normal array
    const normals = new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v0-v1-v2-v3
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v7-v4
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v0-v4-v5-v1
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,     // v1-v5-v6-v2
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,     // v6-v7-v3-v2
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1      // v5-v4-v7-v6
    ]);

    // color array (r,g,b,a)
    const colors = new Float32Array([
        ...xyPlaneColor, ...xyPlaneColor, ...xyPlaneColor, ...xyPlaneColor,  // v0-v1-v2-v3 (top - xy plane)
        ...xzPlaneColor, ...xzPlaneColor, ...xzPlaneColor, ...xzPlaneColor,  // v0-v3-v7-v4 (side - xz plane)
        ...yzPlaneColor, ...yzPlaneColor, ...yzPlaneColor, ...yzPlaneColor,  // v0-v4-v5-v1 (side - yz plane)
        ...yzPlaneColor, ...yzPlaneColor, ...yzPlaneColor, ...yzPlaneColor,  // v1-v5-v6-v2 (side - yz plane)
        ...xyPlaneColor, ...xyPlaneColor, ...xyPlaneColor, ...xyPlaneColor,  // v6-v7-v3-v2 (side - xz plane)
        ...yzPlaneColor, ...yzPlaneColor, ...yzPlaneColor, ...yzPlaneColor   // v5-v4-v7-v6 (bottom - xy plane)
    ]);

    // index array (2 triangles per side)
    const indices = new Uint16Array([
        0, 1, 2, 2, 3, 0,                   // v0-v1-v2, v2-v3-v0
        4, 5, 6, 6, 7, 4,                   // v0-v3-v7, v7-v4-v0
        8, 9, 10, 10, 11, 8,                   // v0-v4-v5, v5-v1-v0
        12, 13, 14, 14, 15, 12,                   // v1-v5-v6, v6-v2-v1
        16, 17, 18, 18, 19, 16,                   // v6-v7-v3, v3-v2-v6
        20, 21, 22, 22, 23, 20                    // v5-v4-v7, v7-v6-v5
    ]);

    let buf = new GlBuffers(gl);

    // create vertex buffer object
    buf.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbo);

    let dataSize = vertices.byteLength + normals.byteLength + colors.byteLength;
    gl.bufferData(gl.ARRAY_BUFFER, dataSize, gl.STATIC_DRAW);

    buf.vOffset = 0;
    gl.bufferSubData(gl.ARRAY_BUFFER, buf.vOffset, vertices);

    buf.nOffset = vertices.byteLength;
    gl.bufferSubData(gl.ARRAY_BUFFER, buf.nOffset, normals);

    buf.cOffset = vertices.byteLength + normals.byteLength;
    gl.bufferSubData(gl.ARRAY_BUFFER, buf.cOffset, colors);

    // create index buffer object
    buf.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    buf.indexCount = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbo);

    // Position attribute (location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, buf.vOffset);

    // Normal attribute (location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, buf.nOffset);

    // Color attribute (location 2)
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, buf.cOffset);

    return buf;
}

export function generate_sphere_vertices(n_slices: number, n_stacks: number): [Float32Array, Float32Array] {
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // add top vertex
    vertices.push(0, 1, 0);
    
    // generate vertices per stack / slice
    for (let i = 0; i < n_stacks - 1; i++) {
        const phi = Math.PI * (i + 1) / n_stacks;
        for (let j = 0; j < n_slices; j++) {
            const theta = 2.0 * Math.PI * j / n_slices;
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);
            vertices.push(x, y, z);
        }
    }
    
    // add bottom vertex
    vertices.push(0, -1, 0);
    
    const v0 = 0; // top vertex index
    const v1 = vertices.length / 3 - 1; // bottom vertex index
    
    // add top triangles
    for (let i = 0; i < n_slices; i++) {
        const i0 = i + 1;
        const i1 = (i + 1) % n_slices + 1;
        indices.push(v0, i1, i0);
    }
    
    // add bottom triangles
    for (let i = 0; i < n_slices; i++) {
        const i0 = i + n_slices * (n_stacks - 2) + 1;
        const i1 = (i + 1) % n_slices + n_slices * (n_stacks - 2) + 1;
        indices.push(v1, i0, i1);
    }
    
    // add quads per stack / slice (as two triangles each)
    for (let j = 0; j < n_stacks - 2; j++) {
        const j0 = j * n_slices + 1;
        const j1 = (j + 1) * n_slices + 1;
        for (let i = 0; i < n_slices; i++) {
            const i0 = j0 + i;
            const i1 = j0 + (i + 1) % n_slices;
            const i2 = j1 + (i + 1) % n_slices;
            const i3 = j1 + i;
            // split quad into two triangles
            indices.push(i0, i1, i2);
            indices.push(i0, i2, i3);
        }
    }

    return [new Float32Array(vertices), new Float32Array(indices)]
}

export function create_sphere(gl: WebGL2RenderingContext): GlBuffers {
    let buf = new GlBuffers(gl);
    const [vertices, indices] = generate_sphere_vertices(5, 5);

    // create vertex buffer object
    buf.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbo);

    let dataSize = vertices.byteLength;
    gl.bufferData(gl.ARRAY_BUFFER, dataSize, gl.STATIC_DRAW);

    buf.vOffset = 0;
    gl.bufferSubData(gl.ARRAY_BUFFER, buf.vOffset, vertices);

    // create index buffer object
    buf.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    buf.indexCount = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbo);

    // Position attribute (location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, buf.vOffset);

    return buf;
}