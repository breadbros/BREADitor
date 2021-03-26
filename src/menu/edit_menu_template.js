import { send } from '../main/SendMsgToMainWindow';

export const editMenuTemplate = {
  label: 'Edit',
  submenu: [
    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:', click () { send('undo'); } },
    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:', click () { send('redo'); } },
    { type: 'separator' },
    { label: 'Swap Selected Tiles', accelerator: 'X', click () { send('tile-swap', 'X'); } },
    { label: 'Tool: Brush', accelerator: 'B', click () { send('tool-brush', 'B'); } },

    { label: 'Move Tile Select Cursor Up', accelerator: 'W', click () { send('move-selected-tile', 'W'); } },
    { label: 'Move Tile Select Cursor Left', accelerator: 'A', click () { send('move-selected-tile', 'A'); } },
    { label: 'Move Tile Select Cursor Down', accelerator: 'S', click () { send('move-selected-tile', 'S'); } },
    { label: 'Move Tile Select Cursor Right', accelerator: 'D', click () { send('move-selected-tile', 'D'); } },

    { label: 'Tool: Eyedropper', accelerator: 'I', click () { send('tool-eyedropper', 'I'); } },
    { label: 'Tool: Smart Eyedropper', accelerator: 'Shift+I', click () { send('tool-smartdropper', 'I'); } },
    { label: 'Tool: Super Cut', accelerator: 'Shift+CmdOrCtrl+X', click () { send('tool-supercut', ''); } },
    { label: 'Tool: Super Paste', accelerator: 'Shift+CmdOrCtrl+V', click () { send('tool-superpaste', ''); } },
    { label: 'Tool: Move Viewport', accelerator: 'space', click () { send('tool-move-viewport', 'space'); } },
    { label: 'Tool: Drag Item', accelerator: 'V', click () { send('tool-drag-item', 'V'); } },
    { label: 'Tool: Marquee Select', accelerator: 'M', click () { send('tool-select', 'M'); } },
    { label: 'Tool: Flood Fill', accelerator: 'G', click () { send('tool-flood-fill', 'G'); } },
    { type: 'separator' },
    { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:', click () { send('edit-cut'); } },
    { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:', click () { send('edit-copy'); } },
    { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:', click () { send('edit-paste'); } },
    { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:',
      click () { send('edit-select-all'); } },

    { type: 'separator' },
    { label: 'Convert tiles in clipboard to c# code', accelerator: 'Shift+CmdOrCtrl+Y', selector: 'clipboard-tiles-to-sullycode:', click () { send('clipboard-tiles-to-sullycode'); } },

    { type: 'separator' },
    { label: 'Cancel selections', accelerator: 'ESC', selector: 'cancel-selections:', click () { send('cancel-selections'); } },

    { type: 'separator' },
    { label: 'Reset Camera', accelerator: 'CmdOrCtrl+0', click () { send('reset-camera'); } },
  ]
};
