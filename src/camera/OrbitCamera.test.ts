import { describe, expect, it } from 'vitest';
import { OrbitCamera } from './OrbitCamera';

describe('OrbitCamera', () => {
  it('la matriz de vista mapea el ojo al origen y el target a -Z', () => {
    const camera = new OrbitCamera({ distance: 10, azimuth: 0, elevation: Math.PI / 2 });
    const eye = camera.eye();
    const view = camera.viewMatrix();

    const eyeView = view.transformPoint(eye);
    expect(eyeView.x).toBeCloseTo(0);
    expect(eyeView.y).toBeCloseTo(0);
    expect(eyeView.z).toBeCloseTo(0);

    const targetView = view.transformPoint(camera.target);
    expect(targetView.z).toBeCloseTo(-10);
  });

  it('turntable clampa la elevación para no cruzar los polos', () => {
    const camera = new OrbitCamera({ orbitMethod: 'turntable', elevation: 0.01 });
    camera.orbit(0, -1000);
    expect(camera.elevation).toBeGreaterThan(0);
    expect(camera.elevation).toBeLessThan(Math.PI);
  });

  it('trackball permite rodar más allá de los polos', () => {
    const camera = new OrbitCamera({ orbitMethod: 'trackball', elevation: 0.01 });
    camera.orbit(0, -1000);
    expect(camera.elevation).toBeLessThan(0);
  });

  it('el zoom mantiene la distancia dentro de los límites', () => {
    const camera = new OrbitCamera({ distance: 10 });
    camera.zoomByFactor(0.000001);
    expect(camera.distance).toBeGreaterThan(0);
  });

  it('las vistas numpad colocan el ojo en la dirección esperada', () => {
    const camera = new OrbitCamera({ distance: 10 });
    camera.rightView();
    const right = camera.eye().subtract(camera.target).normalize();
    expect(right.x).toBeCloseTo(1);
    expect(right.y).toBeCloseTo(0);
    expect(right.z).toBeCloseTo(0);

    camera.topView();
    const top = camera.eye().subtract(camera.target).normalize();
    expect(top.z).toBeCloseTo(1);
  });

  it('frameSelected aleja lo necesario para encajar el radio', () => {
    const camera = new OrbitCamera({ fovYDegrees: 60 });
    camera.frameSelected(10);
    expect(camera.distance).toBeGreaterThan(10);
  });

  it('pan mueve el target sin variar la distancia', () => {
    const camera = new OrbitCamera({ distance: 10, azimuth: 0, elevation: Math.PI / 2 });
    const before = camera.target.clone();
    camera.pan(20, 0);
    expect(camera.distance).toBe(10);
    expect(camera.target.distanceTo(before)).toBeGreaterThan(0);
  });

  it('la proyección ortográfica y la perspectiva son distintas', () => {
    const camera = new OrbitCamera();
    const persp = camera.projectionMatrix(1).elements;
    camera.orthographic = true;
    const ortho = camera.projectionMatrix(1).elements;
    expect(ortho[11]).toBe(0);
    expect(persp[11]).toBe(-1);
  });

  it('frameSelected no admite radios nulos', () => {
    const camera = new OrbitCamera();
    camera.frameSelected(0);
    expect(camera.distance).toBeGreaterThan(0);
  });
});
