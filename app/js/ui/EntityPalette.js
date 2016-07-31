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

export var shouldShowEntitiesForLayer = (layername) => {

  if( !window.$$$currentMap.layerLookup[layername] ) {
    modal_error("cannot shouldShowEntitiesForLayer, '"+layername+"' is not a layer");
  }

  let shouldHide = window.$$$currentMap.layerLookup["Back Parallax"].maped_HIDE_ENTS;

  return !shouldHide;
};

export var setShowEntitiesForLayer = (layername, isVisible) => {
  if( !window.$$$currentMap.layerLookup[layername] ) {
    modal_error("cannot setShowEntitiesForLayer, '"+layername+"' is not a layer");
  }

  window.$$$currentMap.layerLookup["Back Parallax"].maped_HIDE_ENTS = !isVisible;
}


