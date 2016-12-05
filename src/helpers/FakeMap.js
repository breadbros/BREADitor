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
    getTile: getTile,
    setTile: setTile,
    getLayerData: getLayerData
  };
};

export const printLayer = (layerData) => {
  console.log(JSON.stringify(layerData));
};
