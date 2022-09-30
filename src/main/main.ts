import 'source-map-support/register';

import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import * as url from 'url';

import { MainWindow } from './MainWindowReference';
import { devMenuTemplate } from '../menu/dev_menu_template';
import { prodMenuTemplate } from '../menu/prod_menu_template';

let win: BrowserWindow | null;

const contextMenu = require('electron-context-menu');
const { shell } = require('electron');
const { ipcMain } = require('electron');

console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');

const testContextMenu = () => {
  contextMenu({
    prepend: (defaultActions: any, parameters: any, browserWindow: any) => [
      {
        label: 'Rainbow',
        // Only show it when right-clicking images
        visible: parameters.mediaType === 'image'
      },
      {
        label: 'Search Google for “{selection}”',
        // Only show it when right-clicking text
        visible: parameters.selectionText.trim().length > 0,
        click: () => {
          shell.openExternal(
            `https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`
          );
        }
      }
    ]
  });
};
ipcMain.on('testContextMenu', testContextMenu);

const setApplicationMenu = () => {
  const menus: MenuItemConstructorOptions[] = prodMenuTemplate as MenuItemConstructorOptions[];
  // if (process.env.NODE_ENV !== 'production') {
  menus.push(devMenuTemplate);
  // }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log); // eslint-disable-line no-console
};

const createWindow = async () => {
  setApplicationMenu();

  if (process.env.NODE_ENV !== 'production') {
    await installExtensions();
  }

  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const events = require('events');

  console.log(events);
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');

  if (process.env.NODE_ENV !== 'production') {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1'; // eslint-disable-line require-atomic-updates
    win.loadURL(`http://localhost:2003`);
    win.webContents.openDevTools();
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    // Open DevTools, see https://github.com/electron/electron/issues/12438 for why we wait for dom-ready
    win.webContents.once('dom-ready', () => {
      win!.webContents.openDevTools();
    });
  }

  MainWindow.set(win);

  win.on('closed', () => {
    win = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
