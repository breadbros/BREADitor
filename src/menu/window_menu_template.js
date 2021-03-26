import { send } from '../main/SendMsgToMainWindow';

export const windowMenuTemplate = {
  label: 'Window',

  submenu: [
    { label: 'Map', click () { send('map'); } },
    { label: 'Tools', click () { send('tool'); } },
    { label: 'Info', click () { send('info'); } },
    { label: 'Layers', accelerator: 'L', click () { send('layers', 'L'); } },
    { label: 'Zones', click () { send('zones'); } },
    { label: 'Entities', click () { send('entity'); } },
    { label: 'Tileset Selector', click () { send('tileset-selector'); } },
    { label: 'Screenview Indicator', click () { send('screenview-indicator'); } },
    { type: 'separator' },
    {
      label: 'Collect all visible palettes',
      accelerator: 'CmdOrCtrl+Shift+P',
      click () {
        send('all-collect');
      }
    },
    {
      label: 'Show all palettes',
      accelerator: 'CmdOrCtrl+Shift+Alt+P',
      click () {
        send('all-show');
      }
    }
  ]
};
