import { baseHTMLTemplate } from './main/BaseTemplate';
import { setupFreshApp, setupIPCRenderer, setupWindowFunctions } from './main/BaseSetup';

const path = require('path');
const $ = require('jquery');

setupIPCRenderer();
setupWindowFunctions();