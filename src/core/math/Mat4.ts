import { Vec3 } from './Vec3';

/* Matriz 4x4 en orden columna-mayor (convención WebGL), index = col*4 + fila. */
export class Mat4 {
  readonly elements: Float32Array;

  constructor(elements?: Float32Array) {
    this.elements = elements ?? new Float32Array(16);
  }

  static identity(): Mat4 {
    const m = new Mat4();
    m.elements[0] = 1;
    m.elements[5] = 1;
    m.elements[10] = 1;
    m.elements[15] = 1;
    return m;
  }

  static perspective(fovYDegrees: number, aspect: number, near: number, far: number): Mat4 {
    const m = new Mat4();
    const e = m.elements;
    const f = 1 / Math.tan(((fovYDegrees * Math.PI) / 180) / 2);
    const nf = 1 / (near - far);
    e[0] = f / aspect;
    e[5] = f;
    e[10] = (far + near) * nf;
    e[11] = -1;
    e[14] = 2 * far * near * nf;
    return m;
  }

  static orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Mat4 {
    const m = new Mat4();
    const e = m.elements;
    e[0] = 2 / (right - left);
    e[5] = 2 / (top - bottom);
    e[10] = -2 / (far - near);
    e[12] = -(right + left) / (right - left);
    e[13] = -(top + bottom) / (top - bottom);
    e[14] = -(far + near) / (far - near);
    e[15] = 1;
    return m;
  }

  /* Vista lookAt estándar (gl-matrix): el eje Z de vista apunta de center hacia eye. */
  static lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
    const z = Vec3.normalize(eye.clone().subtract(center));
    const x = Vec3.normalize(Vec3.cross(up, z));
    const y = Vec3.cross(z, x);

    const e = new Mat4().elements;
    e[0] = x.x;
    e[1] = y.x;
    e[2] = z.x;
    e[4] = x.y;
    e[5] = y.y;
    e[6] = z.y;
    e[8] = x.z;
    e[9] = y.z;
    e[10] = z.z;
    e[12] = -x.dot(eye);
    e[13] = -y.dot(eye);
    e[14] = -z.dot(eye);
    e[15] = 1;
    return new Mat4(e);
  }

  static translation(x: number, y: number, z: number): Mat4 {
    const m = Mat4.identity();
    m.elements[12] = x;
    m.elements[13] = y;
    m.elements[14] = z;
    return m;
  }

  transformPoint(p: Vec3): Vec3 {
    const e = this.elements;
    const x = e[0]! * p.x + e[4]! * p.y + e[8]! * p.z + e[12]!;
    const y = e[1]! * p.x + e[5]! * p.y + e[9]! * p.z + e[13]!;
    const z = e[2]! * p.x + e[6]! * p.y + e[10]! * p.z + e[14]!;
    const w = e[3]! * p.x + e[7]! * p.y + e[11]! * p.z + e[15]!;
    return new Vec3(x / w, y / w, z / w);
  }
}
