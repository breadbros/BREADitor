import { INFO, ERROR } from './Logging'
import { notify } from './Notification-Pane';

export const handleUndo = () => {
  if (window.$$$currentMap) {
    window.$$$currentMap.UndoRedo.undo();
  } else {
    ERROR('handleUndo on What map?');
  }
};

export const handleRedo = () => {
  if (window.$$$currentMap) {
    window.$$$currentMap.UndoRedo.redo();
  } else {
    ERROR('handleRedo on What map?');
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

  ///////////////////////////////////////////////////////////////
  // ENTITY IMPLEMENTATION
  ///////////////////////////////////////////////////////////////

  const prepare_one_entloc = (ent_id, _valDict) => {
    const {tx, ty, px, py} = Object.assign({}, _valDict);

    return [ent_id, tx, ty, px, py];
  };

  const change_one_entity_location = (
    ent_id, valDict
  ) => {
    const was = Object.assign({}, map.mapData.entities[ent_id].location);

    if (
      was.tx === valDict.tx &&
      was.ty === valDict.ty &&
      was.px === valDict.px &&
      was.py === valDict.py
    ) {
      console.log("EARLY EXIT")
      return;
    }

    undostack_add(
      ENT_MOVE,
      [
        prepare_one_entloc( ent_id, was )
      ]
    );

    _ent_move(ent_id, valDict);
  }

  const _ent_move = (ent_id, valDict) => {
    const currentEntities = map.mapData.entities;

    if( valDict.tx || valDict.tx === 0 ) {
      currentEntities[ent_id].location.tx = valDict.tx;
      currentEntities[ent_id].location.px = null;
    }

    if( valDict.ty || valDict.ty === 0 ) {
      currentEntities[ent_id].location.ty = valDict.ty;
      currentEntities[ent_id].location.py = null;
    }

    currentEntities[ent_id].location.px = valDict.px || currentEntities[ent_id].location.px;
    currentEntities[ent_id].location.py = valDict.py || currentEntities[ent_id].location.py;

    if( valDict.py === 0 ) {
      currentEntities[ent_id].location.ty = 0;
    }

    if( valDict.px === 0 ) {
      currentEntities[ent_id].location.tx = 0;
    }

    const {tx, ty, px, py} = currentEntities[ent_id].location;

    notify(`ent[${ent_id}] moved to ${tx},${ty} p(${px},${px})` );
  }

  const _entmove_inner  = (data, cleanupfunc) => {

    const workSet = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const entId = data[i][0];
      const valDict = {};
      valDict.tx = data[i][1];
      valDict.ty = data[i][2];
      valDict.px = data[i][3];
      valDict.py = data[i][4];

      const was = Object.assign({}, map.mapData.entities[entId].location);

      if (
        was.tx === valDict.tx &&
        was.ty === valDict.ty &&
        was.px === valDict.px &&
        was.py === valDict.py
      ) {
        WARNING("undo/redo 'was' and 'is' are the same.  this should never happen.");
        return;
      }

      _ent_move(entId, valDict);

      workSet.push(prepare_one_entloc(entId, was));
    }

    cleanupfunc(ENT_MOVE, workSet);
  }

  const _undo_ent_move = (data) => {
    _entmove_inner(data, redostack_add);
  };
  const _redo_ent_move = (data) => {
    _entmove_inner(data, undostack_add);
  };

  const _debug_UNDOSTACK = () => {
    console.log("_undoStack.length = " + undoStack.length);
    for(var i=0; i<undoStack.length; i++){
      console.log("_undoStack["+i+"]: ", undoStack[i].data);
    };
  }
  const _debug_REDOSTACK = () => {
    console.log("_redoStack.length = " + redoStack.length);
    for(var i=0; i<redoStack.length; i++){
      console.log("_redoStack["+i+"]: ", redoStack[i].data);
    }
  }


  ///////////////////////////////////////////
  // The list of supported undo/redo types?
  const TILE_CHANGE = "tile-change";
  add_handlers(TILE_CHANGE, _undo_tiles, _redo_tiles);
  const ZONE_CHANGE = "zone-change";
  add_handlers(ZONE_CHANGE, _undo_zones, _redo_zones);
  const ENT_MOVE = "entity-move";
  add_handlers(ENT_MOVE, _undo_ent_move, _redo_ent_move);

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
    _debug_UNDOSTACK: _debug_UNDOSTACK, //testing only
    _debug_REDOSTACK: _debug_REDOSTACK, //testing only

    change_one_tile: change_one_tile,
    change_many_tiles: change_many_tiles,
    prepare_one_tile: prepare_one_tile,

    change_one_zone: change_one_zone,

    change_one_entity_location: change_one_entity_location,
  };

  return UndoRedo;
};
