#version 300 es

layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aColor;

uniform mat4 model;
uniform mat4 proj;

out vec4 vColor;

void main() {
  vColor = aColor;
  gl_Position = proj * model * vec4(aPosition, 1.0);
}