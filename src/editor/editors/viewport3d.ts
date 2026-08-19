import { OrbitCamera } from '../../camera/OrbitCamera';
import { Mat4 } from '../../core/math/Mat4';
import { Vec3 } from '../../core/math/Vec3';
import { RenderLoop } from '../../core/loop/RenderLoop';
import { unregisterEditorInput } from '../../input/InputManager';
import { buildGridLinesData } from '../../render/grid';
import { GridLines } from '../../render/gl/GridLines';
import { Mesh } from '../../render/gl/Mesh';
import { ShaderProgram } from '../../render/gl/ShaderProgram';
import { WebGL2Renderer } from '../../render/gl/WebGL2Renderer';
import { GRID_FRAGMENT, GRID_VERTEX } from '../../render/shaders/grid';
import {
  TERRAIN_FRAGMENT,
  TERRAIN_VERTEX,
  WIREFRAME_FRAGMENT,
  WIREFRAME_VERTEX,
} from '../../render/shaders/terrain';
import { HeightmapGenerator } from '../../terrain/HeightmapGenerator';
import { buildTerrainMesh } from '../../terrain/TerrainMesh';
import type { RegionState } from '../layout/types';
import { editorStore } from '../store';
import type { EditorInstance } from './types';
import { buildViewportChrome, type ViewportChrome } from './viewport3dChrome';
import { buildNavigationGizmo } from './viewport3dGizmo';
import { attachViewportInput, registerViewportKeyboard } from './viewport3dInput';

const LIGHT_DIRECTION = new Vec3(0.45, 0.55, 0.85);
/* Gris claro, visible sobre el degradado oscuro, equivalente al wireframe shading de Blender. */
const WIRE_COLOR = new Vec3(0.72, 0.73, 0.76);
const STATS_INTERVAL_MS = 250;

/* Editor 3D Viewport (núcleo de motor): posee el canvas WebGL2, la cámara orbital, el grid, la
   malla de terreno y su bucle de render. El chrome DOM vive en viewport3dChrome; la entrada en
   viewport3dInput. Cada instancia es independiente: dos viewports partidos orbitan por separado. */
export class Viewport3DEditor implements EditorInstance {
  private areaId = 'viewport';
  private host: HTMLElement | null = null;
  private chrome: ViewportChrome | null = null;
  private renderer: WebGL2Renderer | null = null;
  private terrainProgram: ShaderProgram | null = null;
  private wireframeProgram: ShaderProgram | null = null;
  private gridProgram: ShaderProgram | null = null;
  private mesh: Mesh | null = null;
  private grid: GridLines | null = null;
  private camera: OrbitCamera | null = null;
  private loop: RenderLoop | null = null;
  private unsubscribeStore: (() => void) | null = null;
  private terrainRadius = 50;
  private frameCount = 0;
  private lastStatsAt = 0;

  mount(host: HTMLElement): void {
    this.host = host;
    this.areaId = host.dataset.areaId ?? 'viewport';
    host.classList.add('area');

    this.chrome = buildViewportChrome({
      areaId: this.areaId,
      onFrameSelected: () => this.camera?.smoothFrameSelected(this.terrainRadius),
    });
    const elements = this.chrome.elements;
    host.append(elements.header, elements.tools, elements.window, elements.ui, elements.footer);

    this.renderer = WebGL2Renderer.create(elements.canvas);
    const gl = this.renderer.context;
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.depthFunc(gl.LESS);
    this.terrainProgram = new ShaderProgram(gl, TERRAIN_VERTEX, TERRAIN_FRAGMENT);
    this.wireframeProgram = new ShaderProgram(gl, WIREFRAME_VERTEX, WIREFRAME_FRAGMENT);
    this.gridProgram = new ShaderProgram(gl, GRID_VERTEX, GRID_FRAGMENT);
    this.grid = new GridLines(gl, buildGridLinesData());

    this.camera = new OrbitCamera({
      target: new Vec3(0, 0, 0),
      distance: 200,
      azimuth: Math.PI * 0.75,
      elevation: 1.0,
    });

    this.buildTerrain();
    this.camera.frameSelected(this.terrainRadius);

    elements.window.appendChild(buildNavigationGizmo(() => this.camera));

    attachViewportInput(elements.canvas, () => this.camera);
    registerViewportKeyboard(host, {
      areaId: this.areaId,
      getCamera: () => this.camera,
      getTerrainRadius: () => this.terrainRadius,
    });

    this.unsubscribeStore = editorStore.subscribe((state, previous) => {
      if (state.terrainNonce !== previous.terrainNonce) {
        this.buildTerrain();
      }
      this.chrome?.sync(state);
    });
    this.chrome.sync(editorStore.getState());

    this.loop = new RenderLoop(this.frame);
    this.loop.start();
  }

  updateRegions(regions: RegionState[]): void {
    if (this.host === null || this.chrome === null) {
      return;
    }
    const { header, tools, ui, footer } = this.chrome.elements;
    const findRegion = (type: RegionState['type']): RegionState | undefined =>
      regions.find((region) => region.type === type);
    const headerRegion = findRegion('HEADER');
    const footerRegion = findRegion('FOOTER');
    const toolsRegion = findRegion('TOOLS');
    const uiRegion = findRegion('UI');

    this.host.style.display = 'grid';
    this.host.style.gridTemplateAreas =
      '"header header header" "tools window ui" "footer footer footer"';
    this.host.style.gridTemplateColumns = `${toolsRegion?.visible ? toolsRegion.size : 0}px 1fr ${uiRegion?.visible ? uiRegion.size : 0}px`;
    this.host.style.gridTemplateRows = `${headerRegion?.visible ? headerRegion.size : 0}px 1fr ${footerRegion?.visible ? footerRegion.size : 0}px`;

    header.style.display = headerRegion?.visible ? '' : 'none';
    footer.style.display = footerRegion?.visible ? '' : 'none';
    tools.style.display = toolsRegion?.visible ? '' : 'none';
    ui.style.display = uiRegion?.visible ? '' : 'none';
  }

  dispose(): void {
    this.loop?.stop();
    this.unsubscribeStore?.();
    unregisterEditorInput(this.areaId);
    this.mesh?.dispose();
    this.grid?.dispose();
    this.terrainProgram?.dispose();
    this.wireframeProgram?.dispose();
    this.gridProgram?.dispose();
    this.host = null;
  }

  private readonly frame = (deltaSeconds: number): void => {
    if (this.renderer === null || this.camera === null || this.chrome === null) {
      return;
    }
    const state = editorStore.getState();
    this.camera.orthographic = state.orthographic;
    this.camera.orbitMethod = state.orbitMethod;
    this.camera.update(deltaSeconds);

    this.renderer.resizeToDisplaySize();
    /* Fondo transparente: el degradado del viewport lo pinta el CSS (`.ventanaViewport`). */
    this.renderer.clear(0, 0, 0, 0);

    const { canvas } = this.chrome.elements;
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const view = this.camera.viewMatrix();
    const projection = this.camera.projectionMatrix(aspect);
    const model = Mat4.identity();

    this.drawGrid(view, projection);

    if (this.mesh !== null && this.terrainProgram !== null && this.wireframeProgram !== null) {
      if (state.wireframe) {
        this.wireframeProgram.use();
        this.wireframeProgram.setMat4('uModel', model.elements);
        this.wireframeProgram.setMat4('uView', view.elements);
        this.wireframeProgram.setMat4('uProjection', projection.elements);
        this.wireframeProgram.setVec3('uWireColor', WIRE_COLOR);
        this.mesh.bind();
        this.mesh.drawLines();
      } else {
        this.terrainProgram.use();
        this.terrainProgram.setMat4('uModel', model.elements);
        this.terrainProgram.setMat4('uView', view.elements);
        this.terrainProgram.setMat4('uProjection', projection.elements);
        this.terrainProgram.setVec3('uLightDirection', LIGHT_DIRECTION);
        this.mesh.bind();
        this.mesh.drawTriangles();
      }
    }
    this.updateStats();
  };

  private drawGrid(view: Mat4, projection: Mat4): void {
    if (this.grid === null || this.gridProgram === null || this.renderer === null) {
      return;
    }
    const gl = this.renderer.context;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.gridProgram.use();
    this.gridProgram.setMat4('uView', view.elements);
    this.gridProgram.setMat4('uProjection', projection.elements);
    this.grid.bind();
    this.grid.draw();

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }

  private buildTerrain(): void {
    if (this.renderer === null || this.chrome === null) {
      return;
    }
    const { terrain } = editorStore.getState();
    const heightmap = new HeightmapGenerator().generate({
      size: terrain.size,
      amplitude: terrain.amplitude,
      frequency: terrain.frequency,
      octaves: terrain.octaves,
      lacunarity: 2,
      gain: 0.5,
      seed: terrain.seed,
    });
    const data = buildTerrainMesh({
      size: terrain.size,
      spacing: terrain.spacing,
      heightmap,
      amplitude: terrain.amplitude,
    });
    this.terrainRadius = (terrain.size - 1) * terrain.spacing * 0.72;
    this.mesh?.dispose();
    this.mesh = new Mesh(this.renderer.context, data);
    this.chrome.readouts.stats.textContent = `${data.vertexCount.toLocaleString('es-ES')} vértices · ${data.triangleCount.toLocaleString('es-ES')} tris`;
  }

  private updateStats(): void {
    if (this.camera === null || this.chrome === null) {
      return;
    }
    this.frameCount += 1;
    const now = performance.now();
    if (this.lastStatsAt === 0) {
      this.lastStatsAt = now;
      this.frameCount = 0;
      return;
    }
    const elapsed = now - this.lastStatsAt;
    if (elapsed < STATS_INTERVAL_MS) {
      return;
    }
    const fps = (this.frameCount * 1000) / elapsed;
    this.frameCount = 0;
    this.lastStatsAt = now;

    const { fps: fpsEl, camera: cameraEl, cameraInfo } = this.chrome.readouts;
    fpsEl.textContent = `${fps.toFixed(0)} FPS`;

    const eye = this.camera.eye();
    cameraEl.textContent = `Cam X ${eye.x.toFixed(1)} · Y ${eye.y.toFixed(1)} · Z ${eye.z.toFixed(1)} · Dist ${this.camera.distance.toFixed(1)}`;

    const azimuthDegrees = ((this.camera.azimuth * 180) / Math.PI).toFixed(0);
    const elevationDegrees = ((this.camera.elevation * 180) / Math.PI).toFixed(0);
    cameraInfo.textContent = `Dist ${this.camera.distance.toFixed(1)} · Az ${azimuthDegrees}° · El ${elevationDegrees}°`;
  }
}
