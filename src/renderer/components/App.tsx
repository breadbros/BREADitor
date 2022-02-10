import * as React from 'react';
import Dockable from '../../../../react-dockable/src';
import './css/App.css';
import { oldBootstrap } from '../../old_bootstrap.js';

oldBootstrap();

function App() {
  const hiddenRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState({
    panels: [
      {
        windows: [
          {
            selected: 0,
            widgets: ['tool-palette'],
            minSize: 34
          }
        ],
        size: 137.5,
        minSize: 48,
        maxSize: 0,
        resize: 'stretch'
      },
      {
        windows: [
          {
            selected: 0,
            widgets: ['map-palette'],
            minSize: 34,
            size: 1357,
            maxSize: 0,
            resize: 'stretch'
          }
        ],
        size: 2046,
        minSize: 48,
        maxSize: 0,
        resize: 'stretch'
      },
      {
        windows: [
          {
            selected: 0,
            widgets: ['info-palette'],
            minSize: 34,
            size: 422.5,
            maxSize: 0,
            resize: 'stretch'
          },
          {
            selected: 0,
            widgets: ['zones-palette'],
            minSize: 34,
            size: 360.40625,
            maxSize: 0,
            resize: 'stretch'
          },
          {
            selected: 0,
            widgets: ['layers-palette'],
            size: 568.09375,
            minSize: 34,
            maxSize: 0,
            resize: 'stretch'
          }
        ],
        size: 370.5,
        minSize: 48,
        maxSize: 0,
        resize: 'stretch'
      }
    ]
  });

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
          { id: 'map-palette', name: 'Map Document' },
          { id: 'info-palette', name: 'Info' }
        ].map(el => (
          <UIWrapper
            id={el.id}
            key={el.id}
            title={el.name}
            element={document.getElementsByClassName(el.id)[0]}
            hiddenEl={hiddenRef.current}
          />
        ))}
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
  return useMountable(element, hiddenEl)();
}

// Takes in an DOM element and returns it wrapped in a React Component
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

  return () => (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }} ref={containerRef}></div>
  );
}

export default App;
