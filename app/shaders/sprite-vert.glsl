precision mediump float;
attribute vec2 a_vertices;
uniform vec4 u_camera; // camera offset x, camera offset y, camera scale x, camera scale y

void main() {
    gl_Position = vec4(
        -1.0 + ((a_vertices[0] - u_camera[0]) / u_camera[2]) * 2.0,
        1.0 + ((a_vertices[1] + u_camera[1]) / u_camera[3]) * 2.0,
        0,
        1
    );
}
