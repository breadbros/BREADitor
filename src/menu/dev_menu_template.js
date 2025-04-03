import { app, BrowserWindow } from 'electron';
import { send } from '../main/SendMsgToMainWindow';

export const devMenuTemplate = {
  label: 'Development',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click () {
      BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
    }
  }, {
    label: 'Toggle DevTools',
    accelerator: 'Alt+CmdOrCtrl+I',
    click () {
      BrowserWindow.getFocusedWindow().toggleDevTools();
    }
  },{
    label: 'Toggle Verbose Console Debugging',
    accelerator: 'Alt+CmdOrCtrl+L',
    click () {
      send('toggle-verbose-logging');
    }
  }, {
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click () {
      app.quit();
    }
  }]
};
