precision mediump float;
uniform vec4 u_color;
varying vec2 v_position;

void main() {
    if (v_position[0] >= 0.0 && v_position[0] < 1.0 && v_position[1] >= 0.0 && v_position[1] < 1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
    } else {
        gl_FragColor = u_color;
    }
}