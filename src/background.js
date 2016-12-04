// This is main process of Electron, started as first thing when the Electron
// app starts, and running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { prodMenuTemplate } from './menu/prod_menu_template';
import createWindow from './helpers/window';
import { MainWindow } from './main/MainWindowReference';
import env from './env';
const path = require('path');

const setApplicationMenu = function () {
  const menus = prodMenuTemplate;
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

app.on('ready', function () {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600
  });

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }

  const url = path.join('file://', __dirname, '/app.html');
  mainWindow.loadURL(url);

  MainWindow.set(mainWindow);
});

app.on('window-all-closed', function () {
  app.quit();
});
