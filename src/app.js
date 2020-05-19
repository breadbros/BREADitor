import { baseHTMLTemplate } from './main/BaseTemplate';
import { setupFreshApp, setupWindowFunctions, autoloadMostRecentMapIfAvailable } from './main/BaseSetup';
import { setupIPCRenderer } from './main/IPCRenderer';

const path = require('path');
const $ = require('jquery');

setupIPCRenderer();
setupWindowFunctions();
autoloadMostRecentMapIfAvailable();
