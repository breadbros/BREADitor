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

  const undostack_add = ( foo ) => {
    undoStack.push(foo);
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

    undostack_add(manyChangeStack);
  };

  const undo = () => {
    if (undoStack.length <= 0) {
      return;
    }

    const changes = undoStack.pop();

    const redoSet = [];
    for (let i = changes.length - 1; i >= 0; i--) {
      const was = map.getTile(changes[i][0], changes[i][1], changes[i][2]);

      if (was === changes[i][3]) {
        throw new Error("undo/redo 'was' and 'is' are the same.  this should never happen.");
      }

      map.setTile(
        changes[i][0], changes[i][1],
        changes[i][2], changes[i][3]
      );

      changes[i][3] = was;

      redoSet.push(changes[i]);
    }

    redoStack.push(redoSet);
  };

  const redo = () => {
    if (redoStack.length <= 0) {
      return;
    }

    const changes = redoStack.pop();
    const undoSet = [];
    for (let i = changes.length - 1; i >= 0; i--) {
      const was = map.getTile(changes[i][0], changes[i][1], changes[i][2]);

      if (was === changes[i][3]) {
        throw new Error("undo/redo 'was' and 'is' are the same.  this should never happen.");
      }

      map.setTile(
          changes[i][0], changes[i][1],
          changes[i][2], changes[i][3]
      );

      changes[i][3] = was;

      undoSet.push(changes[i]);
    }

    undostack_add(undoSet);
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
