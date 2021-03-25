import { hot } from 'react-hot-loader/root';
import * as React from 'react';

import PanelGroup from 'react-panelgroup';

const Application = () => (
    <div>        
        <PanelGroup direction="row" borderColor="grey">
            <PanelGroup direction="column" borderColor="grey">
                <div>panel 2</div>
            </PanelGroup>
            <PanelGroup direction="column" borderColor="grey">
                <div>panel 5</div>
                <div>panel 8</div>
            </PanelGroup>
        </PanelGroup>
    </div>
);

export default hot(Application);
