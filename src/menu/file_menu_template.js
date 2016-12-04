import { app, ipcMain } from 'electron';
import { MainWindow } from '../main/MainWindowReference';

var send = (msg) => {
  let contents = MainWindow.get().webContents;
  contents.send('main-menu', msg);
};

export var fileMenuTemplate = {
  label: 'File',
  submenu: [
    { label: 'Load', accelerator: 'CmdOrCtrl+L', click: function () {
      send('load');
    } },
    { label: 'Save', accelerator: 'CmdOrCtrl+S', click: function () {
      send('save');
    } },
    { type: 'separator' },
    { label: 'About Application', click: function () {
      send('about');
    } },
    { type: 'separator' },
    { label: 'Refresh', accelerator: 'Command+R', click: function () { app.refresh(); }},
    { type: 'separator' },
    { label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit(); }}
  ]};
