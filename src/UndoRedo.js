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

    if (was === tileIdx) {
      // console.log('skip draw of duplicate tile.');
      return;
    }

    undoStack.push([[tileX, tileY, layerIdx, was]]);

    map.setTile(
      tileX, tileY,
      layerIdx, tileIdx
    );

    //undolog();
  };

  const undolog = () => {
    console.log('undoStack: ');
    console.log(undoStack);
    console.log('redoStack: ');
    console.log(redoStack);
  };

  const undo = () => {

    if (undoStack.length <= 0) {
// console.log("aborting undo")
      return;
    }

    const changes = undoStack.pop();

    const redoSet = [];
// console.log("changes.length: " + changes.length)
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

      changes[i][3] = was;

      redoSet.push(changes[i]);
      // console.log( "REDOSET: " )
      // console.log( JSON.stringify(redoSet) );
    }

    // console.log( "redostack length BEFORE: " + redoStack.length );
    redoStack.push(redoSet);
    // console.log( "redostack length AFTER: " + redoStack.length );
    // console.log("pushing redoSet on redoStack");
    // console.log( "REDOSTACK: " );
    // console.log( JSON.stringify(redoStack) );
  };

  const redo = () => {
    if (redoStack.length <= 0) {
      return;
    }

    //undolog();

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

    undoStack.push(undoSet);
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
