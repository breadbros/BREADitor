export const FakeMap = () => {
  const matrix = [[
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

  return {
    layers: [{dimensions: {X: 3, Y:3}}], // TODO kill map.layers[0].dimensions.X/Y as dim source of truth
    getTile: getTile,
    setTile: setTile,
    getLayerData: getLayerData,
    getVSPTileLocation: () => { return 1234567890; }
  };
};
