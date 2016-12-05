import { MainWindow } from '../main/MainWindowReference';

const send = (msg) => {
  const contents = MainWindow.get().webContents;
  contents.send('main-menu', msg);
};

export const editMenuTemplate = {
  label: 'Edit',
  submenu: [
    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:', click: function () { send('undo'); } },
    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:', click: function () { send('redo'); } },
    { type: 'separator' },
    { label: 'Swap Selected Tiles', accelerator: 'X', click: function () { send('tile-swap'); } },
    { label: 'Tool: Brush', accelerator: 'B', click: function () { send('tool-brush'); } },
    { label: 'Tool: Eyedropper', accelerator: 'I', click: function () { send('tool-eyedropper'); } },
    { type: 'separator' },
    { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
    { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
    { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
    { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
  ]
};

