/* Shaders GLSL ES 3.00 (WebGL2) para el grid del viewport: líneas con color RGBA por vértice
   (los ejes van coloreados y las líneas del grid con alpha para fundirse con el fondo). */

export const GRID_VERTEX = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec4 aColor;

uniform mat4 uView;
uniform mat4 uProjection;

out vec4 vColor;

void main() {
  gl_Position = uProjection * uView * vec4(aPosition, 1.0);
  vColor = aColor;
}
`;

export const GRID_FRAGMENT = `#version 300 es
precision highp float;

in vec4 vColor;

out vec4 outColor;

void main() {
  outColor = vColor;
}
`;
