import { send } from '../main/SendMsgToMainWindow';

export const windowMenuTemplate = {
  label: 'Window',

  submenu: [
    { label: 'Map', click: function () { send('map'); } },
    { label: 'Tools', click: function () { send('tool'); } },
    { label: 'Info', click: function () { send('info'); } },
    { label: 'Layers', accelerator: 'L', click: function () { send('layers', 'L'); } },
    { label: 'Zones', click: function () { send('zones'); } },
    { label: 'Entities', click: function () { send('entity'); } },
    { label: 'Tileset Selector', click: function () { send('tileset-selector'); } },
    { type: 'separator' },
    {
      label: 'Collect all visible palettes',
      accelerator: 'CmdOrCtrl+Shift+P',
      click: function () {
        send('all-collect');
      }
    },
    {
      label: 'Show all palettes',
      accelerator: 'CmdOrCtrl+Shift+Alt+P',
      click: function () {
        send('all-show');
      }
    }
  ]
};
