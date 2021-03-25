import { setupWindowFunctions, autoloadMostRecentMapIfAvailable } from './main/BaseSetup';
import { setupIPCRenderer } from './main/IPCRenderer';

export const oldBootstrap = () => {
    setupIPCRenderer();
    setupWindowFunctions();
    autoloadMostRecentMapIfAvailable();    
}

