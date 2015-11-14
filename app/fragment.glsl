precision mediump float;
varying vec2 v_position;
uniform vec4 u_dimensions;
uniform sampler2D u_tileLibrary;
uniform sampler2D u_tileLayout;

void main() {
    gl_FragColor = texture2D(u_tileLibrary, v_position);
    // gl_FragColor = vec4(v_position[0] * 0.5 + 0.5, v_position[1] * 0.5 + 0.5, 0, 1);
}
