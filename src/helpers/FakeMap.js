import { MakeUndoRedoStack } from '../UndoRedo';
import { MAGICAL_OBS_LAYER_ID } from '../js/ui/LayersPalette';

export const FakeMap = () => {
  let matrix = [[
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ], [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ]];

  let zones = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  let legacyObsData = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  const getZone = (x, y) => {
    return zones[x][y];
  };

  const setZone = (x, y, z) => {
    zones[x][y] = z;
  };

  const _getObs = (x, y) => {
    return legacyObsData[x][y];
  };

  const _setObs = (x, y, o) => {
    legacyObsData[x][y] = o;
  };


  const getTile = (x, y, l) => {
    if( l === MAGICAL_OBS_LAYER_ID ) {
      return _getObs(x,y); //this is an accurate representation of map.getTile().  I am a hack.
    }

    return matrix[l][x][y];
  };

  const setTile = (x, y, l, t) => {
    if( l === MAGICAL_OBS_LAYER_ID ) {
      _setObs(x,y,t); //this is an accurate representation of map.getTile().  I am a hack.
    } else {
      matrix[l][x][y] = t;
    }
  };

  const getLayerData = (l) => {
    return JSON.parse(JSON.stringify(matrix[l]));
  };

  const getMatrix = () => {
    return matrix;
  };

  const setMatrix = (newMatrix) => {
    matrix = newMatrix;
  };

  const entities = [
    { location : {tx:1, ty:2, px: null, py: null} }, //ent 0
    { location : {tx:null, ty:null, px: 5, py: 6} }, //ent 1
  ];

  let ret = {
    layers: [{dimensions: {X: 3, Y:3}, parallax: {X:1, Y:1}}, {dimensions: {X: 3, Y:3}, parallax: {X:1, Y:1}}],
    mapSizeInTiles: {
      width: 3,
      height: 3
    },
    getTile: getTile,
    setTile: setTile,
    getZone: getZone,
    setZone: setZone,
    getLayerData: getLayerData,
    getMatrix: getMatrix,
    setMatrix: setMatrix,
    getVSPTileLocation: () => { return 1234567890; },
    mapData: {
      isTileSelectorMap: false,
      entities: entities
    }
  };

  ret.UndoRedo = MakeUndoRedoStack(ret);

  return ret;
};
