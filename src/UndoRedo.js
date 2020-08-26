export const handleUndo = () => {
  if (window.$$$currentMap) {
    window.$$$currentMap.UndoRedo.undo();
  }
};

export const handleRedo = () => {
  if (window.$$$currentMap) {
    window.$$$currentMap.UndoRedo.redo();
  }
};


export const MakeUndoRedoStack = (_map) => {
  // todo: definitely need to wipeout undo stack on map change.
  // Probably should make it a child object of Maps, really....
  const undoStack = [];
  const redoStack = [];
  const map = _map;

  const undolog = (msg) => {
    console.log('undolog: ', msg);
    console.log('undoStack: ');
    console.log(undoStack);
    console.log('redoStack: ');
    console.log(redoStack);
  };

  const get_operation_code = (operation) => {
    switch(operation) {
      case "tile-change":
        return "tile-change";
      default:
        throw `Invalid Operation for undo/redo: ${operation}`;
    }
  };


  const undostack_add = ( operation, data ) => {
    // todo make a const define dict for ops to codes
    const op = get_operation_code(operation);
    undoStack.push( {op,data} );
  }

  const redostack_add = ( op, data ) => {
    // todo verify the code is correct
    //const op = get_operation_code(operation);
    redoStack.push( {op,data} );
  }

  /*
  const change_one_entity = ( entIdx, oldEntDataDict, newEntDataDict ) => {

    // nothing changed, no action.
    if(JSON.stringify(oldEntDataDict) === JSON.stringify(newEntDataDict)) {
      return;
    }

    throw "haha no";
  };
  */

  const change_one_tile = (
    tileX, tileY,
    layerIdx, tileIdx
  ) => {
    const was = map.getTile(tileX, tileY, layerIdx);

    if (was === tileIdx) {
      return;
    }

    undostack_add(
      "tile-change",
      [
        prepare_one_tile(tileX, tileY, layerIdx, was)
      ]
    );

    map.setTile(
      tileX, tileY,
      layerIdx, tileIdx
    );
  };

  const prepare_one_tile = (tileX, tileY, layerIdx, tileIdx) => {
    return [tileX, tileY, layerIdx, tileIdx];
  };

  const change_many_tiles = (arManyTiles) => {
    const manyChangeStack = [];
    for (let i = arManyTiles.length - 1; i >= 0; i--) {
      const curTile = arManyTiles[i];

      const tileX = curTile[0];
      const tileY = curTile[1];
      const layerIdx = curTile[2];
      const tileIdx = curTile[3];

      const was = map.getTile(tileX, tileY, layerIdx);

      if (was === tileIdx) {
        console.info('skip draw of duplicate tile.');
        continue;
      }

      map.setTile(
        tileX, tileY,
        layerIdx, tileIdx
      );

      manyChangeStack.push(
        prepare_one_tile(tileX, tileY, layerIdx, was)
      );
    }

    undostack_add("tile-change",manyChangeStack);
  };

  const _undo_tiles = (data) => {
    const redoSet = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const was = map.getTile(data[i][0], data[i][1], data[i][2]);

      if (was === data[i][3]) {
        throw new Error("undo/redo 'was' and 'is' are the same.  this should never happen.");
      }

      map.setTile(
        data[i][0], data[i][1],
        data[i][2], data[i][3]
      );

      data[i][3] = was;

      redoSet.push(data[i]);
    }

    redostack_add("tile-change", redoSet);
  }

  const _redo_tiles = (data) => {
    const undoSet = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const was = map.getTile(data[i][0], data[i][1], data[i][2]);

      if (was === data[i][3]) {
        throw new Error("undo/redo 'was' and 'is' are the same.  this should never happen.");
      }

      map.setTile(
          data[i][0], data[i][1],
          data[i][2], data[i][3]
      );

      data[i][3] = was;

      undoSet.push(data[i]);
    }

    undostack_add("tile-change",undoSet);
  };

  const undo = () => {
    if (undoStack.length <= 0) {
      return;
    }

    const {op, data} = undoStack.pop();
    _undo_functions[op](data);
  };

  const _undo_functions = {
    "tile-change": _undo_tiles
  };

  const _redo_functions = {
    "tile-change": _redo_tiles
  };

  const redo = () => {
    if (redoStack.length <= 0) {
      return;
    }

    const {op, data} = redoStack.pop();
    _redo_functions[op](data);
  };

  const UndoRedo = {
    undo: undo,
    redo: redo,
    _undoStack: undoStack,
    _redoStack: redoStack,
    change_one_tile: change_one_tile,

    change_many_tiles: change_many_tiles,
    prepare_one_tile: prepare_one_tile
  };

  return UndoRedo;
};
