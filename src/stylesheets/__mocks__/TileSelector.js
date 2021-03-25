
let currentTile;

const _test_clearSelector = () => {
  currentTile = "UNSET";
}

_test_clearSelector();

module.exports = {
  setCurrentlySelectedTile: function(t) { currentTile = t; } ,
  getCurrentlySelectedTile: function() {return currentTile},
  _test_clearSelector: _test_clearSelector,
}

