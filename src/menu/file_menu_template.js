import { app } from 'electron';
import { send } from '../main/SendMsgToMainWindow';

export const fileMenuTemplate = {
  label: 'File',
  submenu: [
    { label: 'New', accelerator: 'CmdOrCtrl+N', click: function () {
      send('new');
    } },
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
