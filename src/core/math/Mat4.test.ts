import { describe, expect, it } from 'vitest';
import { Mat4 } from './Mat4';
import { Vec3 } from './Vec3';

describe('Mat4', () => {
  it('lookAt mapea el ojo al origen y el centro a -Z', () => {
    const view = Mat4.lookAt(new Vec3(0, 0, 5), new Vec3(0, 0, 0), new Vec3(0, 1, 0));

    const eyeView = view.transformPoint(new Vec3(0, 0, 5));
    expect(eyeView.x).toBeCloseTo(0);
    expect(eyeView.y).toBeCloseTo(0);
    expect(eyeView.z).toBeCloseTo(0);

    const centerView = view.transformPoint(new Vec3(0, 0, 0));
    expect(centerView.z).toBeCloseTo(-5);
  });

  it('perspectiva proyecta near a z=-1 y far a z=1 en clip', () => {
    const proj = Mat4.perspective(60, 1, 0.1, 100);
    const nearClip = proj.transformPoint(new Vec3(0, 0, -0.1));
    const farClip = proj.transformPoint(new Vec3(0, 0, -100));
    expect(nearClip.z).toBeCloseTo(-1);
    expect(farClip.z).toBeCloseTo(1);
  });
});
