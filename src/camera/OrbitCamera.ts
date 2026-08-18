import { Mat4 } from '../core/math/Mat4';
import { Vec3 } from '../core/math/Vec3';
import type { Camera } from '../render/Camera';

export type OrbitMethod = 'turntable' | 'trackball';

/* Eje "arriba" del mundo en Z, igual que Blender: el terreno crece en Z y el plano base es XY. */
const UP = new Vec3(0, 0, 1);
const MIN_ELEVATION = 0.001;
const MAX_ELEVATION = Math.PI - 0.001;
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 10_000;
const MIN_ORTHO_SCALE = 0.1;
const MAX_ORTHO_SCALE = 10_000;
/* Radianes por píxel para órbita; unidades de mundo por píxel (escaladas por distancia) para pan. */
const ORBIT_SENSITIVITY = 0.01;
const PAN_SENSITIVITY = 0.0012;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface OrbitCameraOptions {
  target?: Vec3;
  distance?: number;
  azimuth?: number;
  elevation?: number;
  fovYDegrees?: number;
  near?: number;
  far?: number;
  orbitMethod?: OrbitMethod;
}

/* Cámara orbital estilo Blender: turntable (eje Z del mundo fijo) o trackball (giro libre).
   Coordenadas esféricas alrededor de `target`: azimuth rota en el plano XY, elevation es el
   ángulo respecto al eje Z (0 = vista desde arriba, PI/2 = horizonte). */
export class OrbitCamera implements Camera {
  readonly target: Vec3;
  distance: number;
  azimuth: number;
  elevation: number;
  fovYDegrees: number;
  near: number;
  far: number;
  orbitMethod: OrbitMethod;
  orthographic: boolean;
  orthoScale: number;

  constructor(options: OrbitCameraOptions = {}) {
    this.target = options.target ?? new Vec3(0, 0, 0);
    this.distance = options.distance ?? 30;
    this.azimuth = options.azimuth ?? Math.PI * 0.75;
    this.elevation = clamp(options.elevation ?? Math.PI * 0.3, MIN_ELEVATION, MAX_ELEVATION);
    this.fovYDegrees = options.fovYDegrees ?? 60;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 10_000;
    this.orbitMethod = options.orbitMethod ?? 'turntable';
    this.orthographic = false;
    this.orthoScale = 50;
  }

  eye(): Vec3 {
    const sinElevation = Math.sin(this.elevation);
    return new Vec3(
      this.target.x + this.distance * sinElevation * Math.cos(this.azimuth),
      this.target.y + this.distance * sinElevation * Math.sin(this.azimuth),
      this.target.z + this.distance * Math.cos(this.elevation),
    );
  }

  viewMatrix(): Mat4 {
    return Mat4.lookAt(this.eye(), this.target, UP);
  }

  projectionMatrix(aspect: number): Mat4 {
    if (this.orthographic) {
      const halfHeight = this.orthoScale / 2;
      const halfWidth = halfHeight * Math.max(aspect, 0.001);
      return Mat4.orthographic(-halfWidth, halfWidth, -halfHeight, halfHeight, this.near, this.far);
    }
    return Mat4.perspective(this.fovYDegrees, Math.max(aspect, 0.001), this.near, this.far);
  }

  /* dx/dy en píxeles. Turntable clampa la elevación para mantener el eje Z arriba;
     trackball permite rodar por encima de los polos. */
  orbit(dxPixels: number, dyPixels: number): void {
    this.azimuth -= dxPixels * ORBIT_SENSITIVITY;
    const nextElevation = this.elevation + dyPixels * ORBIT_SENSITIVITY;
    this.elevation =
      this.orbitMethod === 'turntable'
        ? clamp(nextElevation, MIN_ELEVATION, MAX_ELEVATION)
        : nextElevation;
  }

  /* Pan en el plano de la cámara, proporcional a la distancia para que se sienta estable. */
  pan(dxPixels: number, dyPixels: number): void {
    const forward = this.eye().subtract(this.target).normalize();
    const right = Vec3.cross(forward, UP).normalize();
    const up = Vec3.cross(right, forward).normalize();
    const scale = this.distance * PAN_SENSITIVITY;
    this.target.add(right.scale(-dxPixels * scale));
    this.target.add(up.scale(dyPixels * scale));
  }

  zoomByFactor(factor: number): void {
    this.distance = clamp(this.distance * factor, MIN_DISTANCE, MAX_DISTANCE);
    this.orthoScale = clamp(this.orthoScale * factor, MIN_ORTHO_SCALE, MAX_ORTHO_SCALE);
  }

  setView(azimuth: number, elevation: number): void {
    this.azimuth = azimuth;
    this.elevation = clamp(elevation, MIN_ELEVATION, MAX_ELEVATION);
  }

  frontView(): void {
    this.setView(-Math.PI / 2, Math.PI / 2);
  }

  rightView(): void {
    this.setView(0, Math.PI / 2);
  }

  topView(): void {
    this.setView(0, MIN_ELEVATION);
  }

  oppositeView(): void {
    this.setView(this.azimuth + Math.PI, Math.PI - this.elevation);
  }

  /* Encaja una esfera de radio `radius` en el encuadre (equivale a "frame selected"). */
  frameSelected(radius: number): void {
    const safeRadius = Math.max(radius, 0.001);
    const fovRadians = (this.fovYDegrees * Math.PI) / 180;
    const distance = (safeRadius / Math.sin(fovRadians / 2)) * 1.3;
    this.distance = clamp(distance, MIN_DISTANCE, MAX_DISTANCE);
    this.orthoScale = safeRadius * 2.6;
  }
}
