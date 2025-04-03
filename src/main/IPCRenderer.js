import { ipcRenderer } from 'electron';
import { setVerboseLogging, getVerboseLogging } from '../Logging';

import {
  clickSmartdropper, clickEyedropper, clickDrawBrush, clickMoveViewport, clickSelect, selectAll, clickFloodFill,
  updateLocationFunction, clickDragItem, handle_esc
} from '../Tools.js';

import {
  LayersWidget, selectZoneLayer, selectObstructionLayer, selectNumberedLayer, visibilityFix, newLayerOnNewMap, selectEntityLayer
} from '../js/ui/LayersPalette.js';
import { cut, copy, paste, convertPasteboardToCode } from '../js/ui/CutCopyPaste.js';

import { handleUndo, handleRedo } from '../UndoRedo';
import { toggleSelectedTiles, moveSelectedTile } from '../TileSelector';


export function setupIPCRenderer() {
  console.log("==========================================================");
  console.log("==========================================================");
  console.log("==========================================================");
  console.log("Welcome to the Breaditor!");
  console.log("If you're going to use the Electron console, please undock");
  console.log("it to a seperate window... or else it'll pick up your");
  console.log("keystrokes as hotkey presses.  And that's annoying!");
  console.log("==========================================================");
  console.log("==========================================================");
  console.log("==========================================================");

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
      case 'tool-supercut':
        window.$$$supercut();
        break;
      case 'tool-superpaste':
        window.$$$superpaste();
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
      case 'screenview-indicator':
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
        window.$$$currentMap.resetCamera();
        break;
      case 'clipboard-tiles-to-sullycode':
        convertPasteboardToCode(window.$$$currentMap);
        break;
      // case 'screenview-indicator':
      //   alert('screenview-indicator! Yay1112');
      //   break;
      case 'cancel-selections':
        handle_esc();
        break;
      case 'toggle-verbose-logging':
        setVerboseLogging(!getVerboseLogging());
        break;
      default:
        console.error('Unknown action from main-menu:', arg);
    }
  });
}
