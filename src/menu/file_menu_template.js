import { app } from 'electron';
import { send } from '../main/SendMsgToMainWindow';

export const fileMenuTemplate = {
  label: 'File',
  submenu: [
    { label: 'New', accelerator: 'CmdOrCtrl+N', click () {
      send('new');
    } },
    { label: 'Open', accelerator: 'CmdOrCtrl+O', click () {
      send('load');
    } },
    { label: 'Save', accelerator: 'CmdOrCtrl+S', click () {
      send('save');
    } },
    { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click () {
      send('save-as');
    } },
    { type: 'separator' },
    { label: 'Open Recent...', accelerator: 'CmdOrCtrl+Shift+O', click () {
      send('open-recent');
    } },
    { type: 'separator' },
    { label: 'About Application', click () {
      send('about');
    } },
    { type: 'separator' },
    { label: 'Refresh', accelerator: 'Command+R', click: () => { app.refresh(); } },
    { type: 'separator' },
    { label: 'Quit', accelerator: 'Command+Q', click: () => { app.quit(); } }
  ]};
