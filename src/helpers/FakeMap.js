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

  const getTile = (x, y, l) => {
    return matrix[l][x][y];
  };

  const setTile = (x, y, l, t) => {
    matrix[l][x][y] = t;
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

  return {
    layers: [{dimensions: {X: 3, Y:3}, parallax: {X:1, Y:1}}, {dimensions: {X: 3, Y:3}, parallax: {X:1, Y:1}}],
    mapSizeInTiles: {
      width: 3,
      height: 3
    },
    getTile: getTile,
    setTile: setTile,
    getLayerData: getLayerData,
    getMatrix: getMatrix,
    setMatrix: setMatrix,
    getVSPTileLocation: () => { return 1234567890; },
    mapData: {
      isTileSelectorMap: false,
    }
  };
};
