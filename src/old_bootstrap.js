import {
  setupFreshApp,
  setupWindowFunctions,
  autoloadMostRecentMapIfAvailable,
} from './main/BaseSetup';
import { setupIPCRenderer } from './main/IPCRenderer';
import { Palettes } from './Palettes.js';
import { baseHTMLTemplate } from './main/BaseTemplate';
import { visibilityFix } from './js/ui/LayersPalette.js';

const { $ } = window;

export const oldBootstrap = function () {
  setupIPCRenderer();
  setupWindowFunctions();
  setupHtml();

  autoloadMostRecentMapIfAvailable();
};

function setupHtml() {
  console.log('window', window);
  console.log('window.$', window.$);
  console.log('$', $);

  const $body = window.$('#jquery-ui-base');
  $body.html(baseHTMLTemplate());

  Palettes.setupPaletteRegistry();
  Palettes.setupPaletteListeners();
  window.$$$hide_all_windows();

  setupFreshApp();

  setTimeout(visibilityFix, 1000); // I hate myself for this.
}
