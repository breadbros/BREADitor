
let currentTile;

const _test_clearSelector = () => {
  currentTile = "UNSET";
}

_test_clearSelector();

module.exports = {
  setCurrentlySelectedTile(t) { currentTile = t; } ,
  getCurrentlySelectedTile() {return currentTile},
  _test_clearSelector,
}

