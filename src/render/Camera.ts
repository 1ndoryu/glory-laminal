import type { Mat4 } from '../core/math/Mat4';

/* Contrato de cámara independiente de la implementación: el render sólo pide matrices. */
export interface Camera {
  viewMatrix(): Mat4;
  projectionMatrix(aspect: number): Mat4;
}
