import { setupFreshApp, setupWindowFunctions, autoloadMostRecentMapIfAvailable } from './main/BaseSetup';
import { setupIPCRenderer } from './main/IPCRenderer';
import { Palettes } from './Palettes.js';
import { baseHTMLTemplate } from './main/BaseTemplate';

const {$} = window;

export const oldBootstrap = () => {
    setupIPCRenderer();
    setupWindowFunctions();
    setupHtml();

    autoloadMostRecentMapIfAvailable();
}

function setupHtml() {
    const $body = $('#jquery-ui-base');
    $body.html(baseHTMLTemplate());
    Palettes.setupPaletteRegistry();
    Palettes.setupPaletteListeners();
    window.$$$hide_all_windows();
    
    setupFreshApp();
}

