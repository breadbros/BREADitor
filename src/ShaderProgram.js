export var ShaderProgram = function (gl, vertexSource, fragmentSource) {
  this.gl = gl;
  this.lookup = {};

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error(`Failed to compile vertex shader (${  vertexSource  }): ${  gl.getShaderInfoLog(vertexShader)}`);
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error(`Failed to compile fragment shader (${  fragmentShader  }): ${  gl.getShaderInfoLog(fragmentShader)}`);
  }

  this.program = gl.createProgram();
  gl.attachShader(this.program, vertexShader);
  gl.attachShader(this.program, fragmentShader);
  gl.linkProgram(this.program);
  if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
    throw new Error(`Failed to link shader program: ${  gl.getProgramInfoLog(this.program)}`);
  }
};

ShaderProgram.prototype = {
  use () {
    this.gl.useProgram(this.program);
  },

  uniform (u_name) {
    if (this.lookup[u_name] === undefined) this.lookup[u_name] = this.gl.getUniformLocation(this.program, u_name);
    return this.lookup[u_name];
  },

  attribute (a_name) {
    if (this.lookup[a_name] === undefined) this.lookup[a_name] = this.gl.getAttribLocation(this.program, a_name);
    return this.lookup[a_name];
  }
};
