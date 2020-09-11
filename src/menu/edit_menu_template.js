import { send } from '../main/SendMsgToMainWindow';

export const editMenuTemplate = {
  label: 'Edit',
  submenu: [
    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:', click: function () { send('undo'); } },
    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:', click: function () { send('redo'); } },
    { type: 'separator' },
    { label: 'Swap Selected Tiles', accelerator: 'X', click: function () { send('tile-swap', 'X'); } },
    { label: 'Tool: Brush', accelerator: 'B', click: function () { send('tool-brush', 'B'); } },

    { label: 'Move Tile Select Cursor Up', accelerator: 'W', click: function () { send('move-selected-tile', 'W'); } },
    { label: 'Move Tile Select Cursor Left', accelerator: 'A', click: function () { send('move-selected-tile', 'A'); } },
    { label: 'Move Tile Select Cursor Down', accelerator: 'S', click: function () { send('move-selected-tile', 'S'); } },
    { label: 'Move Tile Select Cursor Right', accelerator: 'D', click: function () { send('move-selected-tile', 'D'); } },

    { label: 'Tool: Eyedropper', accelerator: 'I', click: function () { send('tool-eyedropper', 'I'); } },
    { label: 'Tool: Smart Eyedropper', accelerator: 'Shift+I', click: function () { send('tool-smartdropper', 'I'); } },
    { label: 'Tool: Super Cut', accelerator: 'Shift+CmdOrCtrl+X', click: function () { send('tool-supercut', ''); } },
    { label: 'Tool: Super Paste', accelerator: 'Shift+CmdOrCtrl+V', click: function () { send('tool-superpaste', ''); } },
    { label: 'Tool: Move Viewport', accelerator: 'space', click: function () { send('tool-move-viewport', 'space'); } },
    { label: 'Tool: Drag Item', accelerator: 'V', click: function () { send('tool-drag-item', 'V'); } },
    { label: 'Tool: Marquee Select', accelerator: 'M', click: function () { send('tool-select', 'M'); } },
    { label: 'Tool: Flood Fill', accelerator: 'G', click: function () { send('tool-flood-fill', 'G'); } },
    { type: 'separator' },
    { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:', click: function () { send('edit-cut'); } },
    { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:', click: function () { send('edit-copy'); } },
    { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:', click: function () { send('edit-paste'); } },
    { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:',
      click: function () { send('edit-select-all'); } },

    { type: 'separator' },
    { label: 'Cancel selections', accelerator: 'ESC', selector: 'cancel-selections:', click: function () { send('cancel-selections'); } },

    { type: 'separator' },
    { label: 'Reset Camera', accelerator: 'CmdOrCtrl+0', click: function () { send('reset-camera'); } },
  ]
};
