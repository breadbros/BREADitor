import { modal_error } from './Util.js';

var _entityVisibility = true;
var _entityLayersExpanded = false;

export var setNormalEntityVisibility = (val) => {
  _entityVisibility = !!val;
};

export var getNormalEntityVisibility = () => {
  
  return _entityVisibility;
};

export var setEntityLayersExpanded = (val) => {
  _entityLayersExpanded = !!val;
};

export var getEntityLayersExpanded = () => {
  
  return _entityLayersExpanded;
};