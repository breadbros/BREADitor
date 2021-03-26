import { MakeUndoRedoStack } from '../UndoRedo';
import { MAGICAL_OBS_LAYER_ID, MAGICAL_ZONE_LAYER_ID } from '../js/ui/LayersPalette';

export const FakeMap = () => {
  let fakeLayers = [{dimensions: {X: 3, Y:3}, parallax: {X:1, Y:1}}, {dimensions: {X: 3, Y:3}, parallax: {X:1, Y:1}}];

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

  let entities = [
    { location : {tx:1, ty:2, px: null, py: null} }, // ent 0
    { location : {tx:null, ty:null, px: 5, py: 6} }, // ent 1
  ];

  const mapSizeInTiles = {
    width: 3,
    height: 3
  };

  const obsLayerData = {
    dimensions: {
      X: 4,
      Y: 4
    }
  };

  const setMatrix = (newMatrix) => {
    matrix = newMatrix;
    fakeLayers = [];

    for (let i = 0; i<newMatrix.length; i++) {
      fakeLayers.push({
        dimensions: {X: newMatrix[i][0].length, Y:newMatrix[i].length},
        parallax: {X:1, Y:1}
      });
    }

    // TODO why isnt this working?  Is it a javascript referency scopey thing I'm overlooking?
    // console.log("layers after setMatrix")
    // console.log(_layers);
  };

  const _setZoneMatrix = (m) => {zones = m};
  const _getZoneMatrix = () => {return zones;};

  const _setObsMatrix = (m) => {
    legacyObsData = m
    obsLayerData.dimensions.X = m[0].length;
    obsLayerData.dimensions.Y = m.length;
  };
  const _getObsMatrix = () => {return legacyObsData;};

  const _setAllEntities = (arEntities) => {entities = arEntities};
  const _getAllEntities = () => {return entities;};

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
      return _getObs(x,y); // this is an accurate representation of map.getTile().  I am a hack.
    } if( l === MAGICAL_ZONE_LAYER_ID ) {
      return getZone(x,y);
    }

    return matrix[l][x][y];
  };

  const setTile = (x, y, l, t) => {
    if( l === MAGICAL_OBS_LAYER_ID ) {
      _setObs(x,y,t); // this is an accurate representation of map.getTile().  I am a hack.
    } else if( l === MAGICAL_ZONE_LAYER_ID ) {
      setZone(x,y,t); // this is an accurate representation of map.getTile().  I am a hack.
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

  const ret = {
    layers: fakeLayers,
    mapSizeInTiles,
    obsLayerData,
    dataPath: '',
    
    getTile,
    setTile,
    getZone,
    setZone,
    getLayerData,
    getMatrix,
    setMatrix,
    getVSPTileLocation: () => { return 1234567890; },
    mapData: {
      isTileSelectorMap: false,
      entities
    },
    _setZoneMatrix,
    _getZoneMatrix,
    _setObsMatrix,
    _getObsMatrix,
    _setAllEntities,
    _getAllEntities,
  };

  ret.UndoRedo = MakeUndoRedoStack(ret);

  return ret;
};
