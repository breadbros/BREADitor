import { modal_error } from './Util.js';

var _entityVisibility = false;

export var setNormalEntityVisibility = (val) => {
  _entityVisibility = !!val;
};

export var getNormalEntityVisibility = () => {
  return _entityVisibility;
};