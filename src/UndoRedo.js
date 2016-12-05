const sprintf = require('sprintf-js').sprintf;

export const MakeUndoRedoStack = (_map) => {
  // todo: definitely need to wipeout undo stack on map change.
  // Probably should make it a child object of Maps, really....
  const undoStack = [];
  let redoStack = [];
  const map = _map;

  const change_one_tile = (
    tileX, tileY,
    layerIdx, tileIdx
  ) => {
    const was = map.getTile(tileX, tileY, layerIdx);

    console.log(sprintf('WAS %s, IS %s', was, tileIdx));

    if (was === tileIdx) {
      console.log('skip draw of duplicate tile.');
      return;
    }

    undoStack.push([[tileX, tileY, layerIdx, was]]);

    map.setTile(
      tileX, tileY,
      layerIdx, tileIdx
    );
    redoStack = [];

    undolog();
  };

  const undolog = () => {
    console.log('undoStack: ');
    console.log(undoStack);
    console.log('redoStack: ');
    console.log(redoStack);
  };

  const undo = () => {
    undolog();

    if (undoStack.length <= 0) {
      return;
    }

    const changes = undoStack.pop();
    // redoStack.push(changes);

    const redoSet = [];

    for (let i = changes.length - 1; i >= 0; i--) {
      // todo: undostacks should be a child of Map objects.  This is a poor temporary solution
      const was = map.getTile(changes[i][0], changes[i][1], changes[i][2]);

      if (was === changes[i][3]) {
        throw new Error("undo/redo 'was' and 'is' are the same.  this should never happen.");
      }

      map.setTile(
        changes[i][0], changes[i][1],
        changes[i][2], changes[i][3]
      );

      redoSet.push([changes[i][0], changes[i][1], changes[i][2], was]);
    }

    redoStack.push(redoSet);
  };

  const redo = () => {
    if (redoStack.length <= 0) {
      return;
    }

    undolog();

    const changes = redoStack.pop();
    undoStack.push(changes);

    for (let i = changes.length - 1; i >= 0; i--) {
          // / undostacks should be a child of Map objects.  This is a poor temporary solution
      map.setTile(
          changes[i][0], changes[i][1],
          changes[i][2], changes[i][3]
      );
    }
  };

  const UndoRedo = {
    undo: undo,
    redo: redo,
    _undoStack: undoStack,
    _redoStack: redoStack,
    change_one_tile: change_one_tile
  };

  return UndoRedo;
};
