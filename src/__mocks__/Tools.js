
let _tx; let _ty; let _px; let _py;

const _clearMouse = () => {
  _tx = "UNSET";
  _ty = "UNSET";
  _px = "UNSET";
  _py = "UNSET";  
}

_clearMouse();

module.exports = {
  _test_SetXYFromMouse( tx, ty, px, py ) { _tx = tx; _ty = ty; _px = px; _py = py; },
  _test_clearXYFromMouse: _clearMouse,
  getXYFromMouse(map, evt) { return [_tx, _ty, _px, _py]; },
  isTileSelectorMap() { return false; },
}

