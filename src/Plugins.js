import { WARN } from './Logging';
import { APPDATA_DIR } from './main/FileSystemSetup';
import { notify } from './Notification-Pane';

const jetpack = require('fs-jetpack');

const PLUGIN_FOLDER_NAME = 'Plugins';

export const loadPlugins = () => {
  const dirs = jetpack.list(APPDATA_DIR);

  if(!dirs.includes(PLUGIN_FOLDER_NAME)) {
    return;
  }

  const plugins = jetpack.list(jetpack.path(APPDATA_DIR, PLUGIN_FOLDER_NAME));
  plugins.forEach(element => {
    if( jetpack.exists(jetpack.path(APPDATA_DIR, PLUGIN_FOLDER_NAME, element, 'index.js')) ) {
        const module = jetpack.path(APPDATA_DIR, PLUGIN_FOLDER_NAME, element, 'index.js');

        notify(`Loaded Plugin ${element}...`);
        global.require(module);
        
      } else {
        notify(`Tried to load plugin ${element} but there was no index.js`);
      }
    });
}