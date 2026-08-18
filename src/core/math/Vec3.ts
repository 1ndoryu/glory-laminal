/* Semilla de la matemática propia del motor. Estilo mutable con encadenamiento (como
   three.js/Unity) para evitar presión de GC en el bucle de juego. Crecerá con Mat4/Quat según haga falta. */
export class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  distanceTo(other: Vec3): number {
    return Math.hypot(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  dot(other: Vec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  normalize(): this {
    const length = this.length();
    if (length === 0) {
      throw new Error('No se puede normalizar un vector de longitud cero');
    }
    this.x /= length;
    this.y /= length;
    this.z /= length;
    return this;
  }

  add(other: Vec3): this {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  }

  subtract(other: Vec3): this {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  }

  scale(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  cross(other: Vec3): this {
    const { x, y, z } = this;
    this.x = y * other.z - z * other.y;
    this.y = z * other.x - x * other.z;
    this.z = x * other.y - y * other.x;
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  static cross(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }

  static normalize(v: Vec3): Vec3 {
    return v.clone().normalize();
  }
}
