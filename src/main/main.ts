import 'source-map-support/register';

import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import * as url from 'url';

import { MainWindow } from './MainWindowReference';
import { devMenuTemplate } from '../menu/dev_menu_template';
import { prodMenuTemplate } from '../menu/prod_menu_template';

let win: BrowserWindow | null;

const setApplicationMenu = () => {
    const menus:MenuItemConstructorOptions[] = prodMenuTemplate as MenuItemConstructorOptions[];
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

    console.log("Are we gonna install extensions?");
    if (process.env.NODE_ENV !== 'production') {
        console.log("Yes?");
        await installExtensions();
    } else {
        console.log("No?");
    }
    console.log("We are done thinking about extensions?");

    win = new BrowserWindow({ 
        width: 1000, 
        height: 600,
        webPreferences: {
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });

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
