import { app, BrowserWindow } from 'electron';
import { setVerboseLogging, getVerboseLogging } from '../Logging';

export const devMenuTemplate = {
  label: 'Development',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function () {
      BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
    }
  }, {
    label: 'Toggle DevTools',
    accelerator: 'Alt+CmdOrCtrl+I',
    click: function () {
      BrowserWindow.getFocusedWindow().toggleDevTools();
    }
  },{
    label: 'Toggle Verbose Console Debugging',
    accelerator: 'Alt+CmdOrCtrl+L',
    click: function () {
      setVerboseLogging(!getVerboseLogging());
    }
  }, {
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: function () {
      app.quit();
    }
  }]
};
