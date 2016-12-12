import { app } from 'electron';
import { MainWindow } from '../main/MainWindowReference';

const send = (msg) => {
  const contents = MainWindow.get().webContents;
  contents.send('main-menu', msg);
};

export const fileMenuTemplate = {
  label: 'File',
  submenu: [
    { label: 'Open', accelerator: 'CmdOrCtrl+O', click: function () {
      send('load');
    } },
    { label: 'Save', accelerator: 'CmdOrCtrl+S', click: function () {
      send('save');
    } },
    { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: function () {
      send('save-as');
    } },
    { type: 'separator' },
    { label: 'About Application', click: function () {
      send('about');
    } },
    { type: 'separator' },
    { label: 'Refresh', accelerator: 'Command+R', click: () => { app.refresh(); } },
    { type: 'separator' },
    { label: 'Quit', accelerator: 'Command+Q', click: () => { app.quit(); } }
  ]};
