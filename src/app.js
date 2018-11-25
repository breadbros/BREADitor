import { baseHTMLTemplate } from './main/BaseTemplate';
import { setupFreshApp, setupIPCRenderer, setupWindowFunctions, autoloadMostRecentMapIfAvailable } from './main/BaseSetup';

const path = require('path');
const $ = require('jquery');

setupIPCRenderer();
setupWindowFunctions();
autoloadMostRecentMapIfAvailable();