import { ipcRenderer } from 'electron';

import {
  clickSmartdropper, clickEyedropper, clickDrawBrush, clickMoveViewport, clickSelect, selectAll, clickFloodFill,
  updateLocationFunction, clickDragItem, handle_esc
} from '../Tools.js';

import {
  LayersWidget, selectZoneLayer, selectObstructionLayer, selectNumberedLayer, visibilityFix, newLayerOnNewMap, selectEntityLayer
} from '../js/ui/LayersPalette.js';
import { cut, copy, paste } from '../js/ui/CutCopyPaste.js';

import { handleUndo, handleRedo } from '../UndoRedo';
import { toggleSelectedTiles, moveSelectedTile } from '../TileSelector';


export function setupIPCRenderer() {
  // Setup IPC
  ipcRenderer.on('main-menu', (event, arg) => {
    if (typeof arg.accelerator === 'string') {
      const el = document.activeElement;
      if (el.type && el.type === 'text') {
        // NOTE - enabling this console log slows all data entry RIGHT the fuck down
        // console.info('in a textfield, ignoring the accelerator');
        return;
      }

      if (el.type && el.type === 'number') {
        // NOTE - enabling this console log slows all data entry RIGHT the fuck down
        // console.info('in a textfield, ignoring the accelerator');
        return;
      }

      if( arg.msg == 'tool-move-viewport' && el.type) {
        return;
      }

      // console.log(document.activeElement);
      // var el = document.activeElement;
      // debugger;
    }

    switch (arg.msg) {
      case 'new':
        window.$$$new();
        break;
      case 'save':
        window.$$$save();
        break;
      case 'save-as':
        window.$$$saveAs();
        break;
      case 'open-recent':
        window.$$$openRecent();
        break;
      case 'load':
        window.$$$load();
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'tile-swap':
        // TODO don't do this if you're in a text-editing field
        toggleSelectedTiles(window.$$$currentMap);
        break;
      case 'tool-brush':
        clickDrawBrush();
        break;
      case 'move-selected-tile':
        moveSelectedTile(arg.accelerator, window.$$$currentTilsesetSelectorMap);
        break;
      case 'tool-eyedropper':
        clickEyedropper();
        break;
      case 'tool-smartdropper':
        clickSmartdropper();
        break;
      case 'tool-move-viewport':
        clickMoveViewport();
        break;
      case 'tool-drag-item':
        clickDragItem();
        break;
      case 'tool-flood-fill':
        clickFloodFill();
        break;
      case 'tool-select':
        clickSelect();
        break;
      case 'about':
        window.$$$about_breaditor();
        break;
      case 'focus-layer-O':
        selectObstructionLayer(true);
        break;
      case 'focus-layer-Z':
        selectZoneLayer(true);
        break;
      case 'focus-layer-E':
        selectEntityLayer(true);
        break;
      case 'focus-layer-1':
      case 'focus-layer-2':
      case 'focus-layer-3':
      case 'focus-layer-4':
      case 'focus-layer-5':
      case 'focus-layer-6':
      case 'focus-layer-7':
      case 'focus-layer-8':
      case 'focus-layer-9':
        const argParsed = arg.msg.split('-');
        selectNumberedLayer(parseInt(argParsed[argParsed.length - 1]));
        break;
      case 'map':
      case 'tool':
      case 'info':
      case 'layers':
      case 'zones':
      case 'entity':
      case 'tileset-selector':
        window.$$$toggle_pallete(arg);
        break;
      case 'all-collect':
        window.$$$collect_all_windows();
        break;
      case 'all-show':
        window.$$$show_all_windows();
        break;
      case 'edit-cut':
        cut(window.$$$currentMap);
        break;
      case 'edit-copy':
        copy(window.$$$currentMap);
        break;
      case 'edit-paste':
        paste(window.$$$currentMap);
        break;
      case 'edit-select-all':
        selectAll(window.$$$currentMap);
        break;
      case 'reset-camera':
        // TODO: This inline implementation is clearly out of step with the rest of these, but I couldn't find a dedicated camera control section anywhere (and didn't want to build one just for this)
        const ResetCamera = (map) => {
          map.camera[0] = 0; // X
          map.camera[1] = 0; // Y
          map.camera[2] = 1; // Zoom (1x)
        };
        ResetCamera(window.$$$currentMap);
        break;
      case 'screenview-indicator':
        alert('screenview-indicator! Yay1112');
        break;
      case 'cancel-selections':
        handle_esc();
        break;
      default:
        console.error('Unknown action from main-menu:', arg);
    }
  });
}
