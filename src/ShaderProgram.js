export var ShaderProgram = function (gl, vertexSource, fragmentSource) {
  this.gl = gl;

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw new Error("Failed to compile vertex shader (" + vertexSource+'): ' + gl.getShaderInfoLog(vertexShader));
    }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw new Error("Failed to compile fragment shader (" + fragmentShader+'): ' + gl.getShaderInfoLog(fragmentShader));
    }

  this.program = gl.createProgram();
  gl.attachShader(this.program, vertexShader);
  gl.attachShader(this.program, fragmentShader);
  gl.linkProgram(this.program);
  if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Failed to link shader program: ' + gl.getProgramInfoLog(this.program));
    }
};

ShaderProgram.prototype = {
  use: function () {
      this.gl.useProgram(this.program);
    },

  uniform: function (u_name) {
      return this.gl.getUniformLocation(this.program, u_name);
    },

  attribute: function (a_name) {
      return this.gl.getAttribLocation(this.program, a_name);
    }
};
