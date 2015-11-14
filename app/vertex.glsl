precision mediump float;
attribute vec2 a_position;
varying vec2 v_position;
uniform sampler2D u_tileLibrary;
uniform sampler2D u_tileLayout;

void main() {
    gl_Position = vec4(a_position[0], a_position[1], 0, 1);
    v_position = vec2(a_position[0] * 0.5 + 0.5, -a_position[1] * 0.5 + 0.5);
}
