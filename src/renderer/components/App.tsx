import * as React from 'react';
import Dockable from '../../../../react-dockable/src';
import './css/App.css';
import { oldBootstrap } from '../../old_bootstrap.js';
import initialState from './initialState.js';

oldBootstrap();

let activeDocument = null;

export const setActiveDocument = (doc:any) => {
  activeDocument = doc;
  debugger;
};

function App() {
  const hiddenRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState(initialState);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh'
      }}
    >
      <div style={{ display: 'none' }} ref={hiddenRef}></div>
      <Dockable
        initialState={state.panels}
        onUpdate={workspace => setState({ panels: workspace })}
        spacing={3}
      >
        {[
          { id: 'tool-palette', name: 'Tools' },
          { id: 'layers-palette', name: 'Layers' },
          { id: 'zones-palette', name: 'Zones' },
          { id: 'entity-palette', name: 'Entity' },
          { id: 'map-palette', name: 'Map Document' },
//          { id: 'info-palette', name: 'Info' },
          { id: 'screenview-indicator-palette', name: 'Screenview Indicator' },
          { id: 'tileset-selector-palette', name: 'Tileset Selector' },
        ].map(el => (
          <UIWrapper
            id={el.id}
            key={el.id}
            title={el.name}
            element={document.getElementsByClassName(el.id)[0]}
            hiddenEl={hiddenRef.current}
          />
        ))}
{/* <InfoPalette name="Info" id="info-palette" /> */}
      </Dockable>
    </div>
  );
}

type UIWrapperPropTypes = {
  id: string;
  title?: string;
  element: Element;
  hiddenEl: HTMLDivElement | null;
};

function UIWrapper({ element, hiddenEl }: UIWrapperPropTypes) {
  const mountRef = useMountable(element, hiddenEl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }} ref={mountRef}></div>
  );
}

// Takes in an DOM element and returns a ref for assigning to the mount location
function useMountable(element: Element, hiddenEl: HTMLDivElement | null) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current && hiddenEl) {
      containerRef.current.appendChild(element);
      return () => {
        hiddenEl.appendChild(element);
      };
    }
  }, [containerRef, hiddenEl]);

  return containerRef;
}

export default App;
