import { INFO } from './Logging'

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

  const _registered_operations = {};
  const _undo_functions = {};
  const _redo_functions = {};
  const add_handlers = (key, undo, redo) => {
    if(_registered_operations[key]) {
      throw `Cannot re-register undo/redo handlers for ${key}`;
    }

    _undo_functions[key] = undo;
    _redo_functions[key] = redo;
    _registered_operations[key] = key;
  }

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
    if(_registered_operations[operation]) {
      return _registered_operations[operation];
    }
    throw `Invalid Operation for undo/redo: ${operation}`;
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

  ///////////////////////////////////////////////////////////////
  // TILE IMPLEMENTATION
  ///////////////////////////////////////////////////////////////
  const change_one_tile = (
    tileX, tileY,
    layerIdx, tileIdx
  ) => {
    const was = map.getTile(tileX, tileY, layerIdx);

    if (was === tileIdx) {
      return;
    }

    undostack_add(
      TILE_CHANGE,
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
        INFO('skip draw of duplicate tile.');
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

    undostack_add(TILE_CHANGE,manyChangeStack);
  };

  const _tile_change  = (data, stack_func) => {
    const workSet = [];
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

      workSet.push(data[i]);
    }

    stack_func(TILE_CHANGE, workSet);
  };

  const _undo_tiles = (data) => {
    _tile_change(data, redostack_add)
  }

  const _redo_tiles = (data) => {
    _tile_change(data, undostack_add)
  };


  ///////////////////////////////////////////////////////////////
  // ZONE IMPLEMENTATION
  ///////////////////////////////////////////////////////////////
  const change_one_zone = (
    tileX, tileY, zoneIdx
  ) => {
    const was = map.getZone(tileX, tileY);

    if (was === zoneIdx) {
      return;
    }

    undostack_add(
      ZONE_CHANGE,
      [
        prepare_one_zone(tileX, tileY, was)
      ]
    );

    map.setZone(
      tileX, tileY, zoneIdx
    );
  };

  const prepare_one_zone = (tileX, tileY, zoneIdx) => {
    return [tileX, tileY, zoneIdx];
  };

  const _zone_change  = (data, cleanupfunc) => {
    const workSet = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const was = map.getZone(data[i][0], data[i][1]);

      if (was === data[i][2]) {
        throw new Error("undo/redo 'was' and 'is' are the same.  this should never happen.");
      }

      map.setZone(
        data[i][0], data[i][1], 
        data[i][2]
      );

      data[i][2] = was;

      workSet.push(data[i]);
    }

    cleanupfunc(ZONE_CHANGE, workSet);
  }

  const _undo_zones = (data) => {
    _zone_change(data, redostack_add);
  };
  const _redo_zones = (data) => {
    _zone_change(data, undostack_add);
  };



  ///////////////////////////////////////////
  // The list of supported undo/redo types?
  const TILE_CHANGE = "tile-change";
  add_handlers(TILE_CHANGE, _undo_tiles, _redo_tiles);
  const ZONE_CHANGE = "zone-change";
  add_handlers(ZONE_CHANGE, _undo_zones, _redo_zones);



  ///////////////////////////////////////////
  // the "public" interface

  const undo = () => {
    if (undoStack.length <= 0) {
      return;
    }

    const {op, data} = undoStack.pop();
    _undo_functions[op](data);
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
    
    _undoStack: undoStack, //testing only
    _redoStack: redoStack, //testing only

    change_one_tile: change_one_tile,
    change_many_tiles: change_many_tiles,
    prepare_one_tile: prepare_one_tile,

    change_one_zone: change_one_zone,
  };

  return UndoRedo;
};
