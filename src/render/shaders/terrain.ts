/* Shaders GLSL ES 3.00 (WebGL2) para el terreno: relleno con luz direccional + wireframe plano. */

export const TERRAIN_VERTEX = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vNormal;
out vec3 vColor;

void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  gl_Position = uProjection * uView * worldPosition;
}
`;

export const TERRAIN_FRAGMENT = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vColor;

uniform vec3 uLightDirection;

out vec4 outColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 light = normalize(uLightDirection);
  float diffuse = max(dot(normal, light), 0.0);
  float ambient = 0.35;
  float brightness = ambient + diffuse * 0.7;
  outColor = vec4(vColor * brightness, 1.0);
}
`;

export const WIREFRAME_VERTEX = `#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`;

export const WIREFRAME_FRAGMENT = `#version 300 es
precision highp float;

uniform vec3 uWireColor;

out vec4 outColor;

void main() {
  outColor = vec4(uWireColor, 1.0);
}
`;
