precision mediump float;
attribute vec2 a_position;
varying vec2 v_position;
uniform vec4 u_viewport; // screenview x, screenview y, screenview width, screenview height
uniform vec4 u_camera; // camera offset x, camera offset y, rendercontainer width, rendercontainer height

void main() {
    gl_Position = vec4(a_position[0], a_position[1], 0, 1);

// TODO use u_viewport[0,1] (and maybe u_camera[0,1]?) to offset the window, too
    v_position = vec2(
        ((a_position[0] + 1.0) / 2.0) * (u_camera[2] / u_viewport[2]) - (u_viewport[0] / u_viewport[2]),
        ((-a_position[1] + 1.0) / 2.0) * (u_camera[3] / u_viewport[3]) - (u_viewport[1] / u_viewport[3])
    );
}