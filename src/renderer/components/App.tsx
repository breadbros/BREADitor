import * as React from 'react';
// @ts-ignore
import Dockable from '../../../node_modules/react-dockable';
import './css/App.css';
import { oldBootstrap } from '../../old_bootstrap.js';
import initialState from './initialState.js';
import { getSelectedTileInfo } from '../../TileSelector';

import { getCurrentHoverTile } from '../../Tools';

import { ipcRenderer } from 'electron';

import * as EventBus from '../../EventBus';

// const [nonce, setNonce] = React.useState(0);
const path = require('path');

oldBootstrap();

let activeDocument: any = null;

export const setActiveDocument = (doc: any) => {
  activeDocument = doc;
};

const LineItem = (props: any) => {
  const { id, labelName, value }: any = props;

  return (
    <div className="line-item">
      <label htmlFor={id}>{labelName}</label>
      <span id={id}>{value}</span>
    </div>
  );
};

function InfoPalette({ map }: any) {
  if (!map) {
    return <h1>uninitialized!</h1>;
  }

  ipcRenderer.send('testContextMenu');

  // React.useEffect(()=>{
  //   EventBus.$on("MAP_UPDATE", () => {
  //     console.log("MAP_UPDATE");
  //     setNonce((oldNonce)=>oldNonce+1)
  //   });
  // },[])

  const _path = map.mapPath;
  const pathParts = map.mapPath.split(path.sep);
  const displayPath = pathParts[pathParts.length - 1];

  const vspList: any = {};
  Object.keys(map.mapData.vsp).forEach((keyName) => {
    const vspPath = map.mapData.vsp[keyName];
    // const fullpath = path.dirname(map.mapPath) + path.sep + vspPath;
    vspList[keyName] = vspPath;
  });

  // const curTile = getCurrentHoverTile(map) || [0,0];

  /*

export const updateInfoDims = (map) => {
  $('#info-dims').text(`${map.mapSizeInTiles.width  }x${  map.mapSizeInTiles.height}`);
};

export const updateLocationText = (map) => {
  $('#info-location').text(`${map.camera[0]  },${  map.camera[1]}`);
}

export const updateZoomText = (map) => {
  if(!map) {
    map = window.$$$currentMap;
  }

  const txt = `${100 / map.camera[2]  }%`;
  
  $('#info-zoom').text(txt);
};

Object.keys(map.mapData.vsp).forEach( (keyName) => { 
  const vspPath = map.mapData.vsp[keyName];
  const className = `vsp-info-${keyName}`;
  const $node = $(`<li class="${className}">${keyName}: ${vspPath}</li>`);

  const fullpath = path.dirname(map.mapPath) + path.sep + vspPath;

  $('#info-vsp-list').append( $node );  

  const vspMenu = $(function() {
    $.contextMenu({
        selector: `.${className}`, 
        callback(key, options) {
            switch(key) {
              case "JSON":
                shell.openItem(fullpath);
                return;
              case "Image":
                shell.openItem(map.vspImages[keyName].src);
                return;
              case "Copy-JSON":
                clipboard.writeText(fullpath, 'clipboard');
                return;
              case "Copy-Image":
                clipboard.writeText(map.vspImages[keyName].src, 'clipboard');
            }
        },
        items: {
            "JSON": {name: "Open VSP JSON", icon: "fa-edit"},
            "Copy-JSON": {name: "Copy VSP JSON Path to Clipboard", icon: "fa-edit"},
            "Image": {name: "Open VSP Image", icon: "fa-palette"},
            "Copy-Image": {name: "Copy VSP Image Path to Clipboard", icon: "fa-palette"},
        }
    });
  });

  mapAndFileMenus.push(vspMenu);
} );
*/

  const selTile = getSelectedTileInfo();

  return (
    <div className="info-palette">
      <style>{`
        div.info-palette {
          padding: 4px;

          display: grid;
          grid-template-columns: 1fr 3fr;
          gap: 2px;
        }

        div.line-item {
          display: contents;
        }

        div.line-item > label {
          white-space: nowrap;
          font-weight: bold;
        }

        div.line-item > span {
          font-family: monospace;
        }

      `}</style>
      <LineItem id="info-map-name" labelName="Map" value={displayPath} />

      {Object.keys(vspList).map((key) => {
        const val = vspList[key];

        return <LineItem id="info-vsp-list" labelName={`VSP [${key}]`} value={val} />;
      })}

      {/*
      <LineItem
        id="info-current-hover"
        labelName="Current Hover"
        value={1}  getCurrentHoverTile().join(',') 
      />
*/}
      <LineItem
        id="info-dimensions"
        labelName="Dimensions"
        value={`${map.mapSizeInTiles.width}x${map.mapSizeInTiles.height}`}
      />
      <LineItem
        id="info-location"
        labelName="Location"
        value={`${map.camera[0]},${map.camera[1]}`}
      />
      <LineItem id="info-zoom" labelName="Zoom" value={`${100 / map.camera[2]}%`} />
      <LineItem
        id="info-selected-tiles"
        labelName="Selected Tiles"
        value={`${selTile.left}, ${selTile.right} (${selTile.vsp}) `}
      />
      <LineItem id="info-rstring" labelName="Renderstring" value={map.layerRenderOrder.join(',')} />
      <LineItem id="info-current-tool" labelName="Current Tool" value={map.TOOLMODE} />
    </div>
  );
}

function App() {
  const hiddenRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState(initialState);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <div style={{ display: 'none' }} ref={hiddenRef}></div>
      <Dockable
        initialState={state.panels}
        onUpdate={(workspace: any) => setState({ panels: workspace })}
        spacing={3}
      >
        {[
          { id: 'tool-palette', name: 'Tools' },
          { id: 'layers-palette', name: 'Layers' },
          { id: 'zones-palette', name: 'Zones' },
          { id: 'entity-palette', name: 'Entity' },
          { id: 'map-palette', name: 'Map Document' },
          // { id: 'info-palette', name: 'Info' },
          { id: 'screenview-indicator-palette', name: 'Screenview Indicator' },
          { id: 'tileset-selector-palette', name: 'Tileset Selector' },
        ].map((el) => (
          <UIWrapper
            id={el.id}
            key={el.id}
            title={el.name}
            element={document.getElementsByClassName(el.id)[0]}
            hiddenEl={hiddenRef.current}
          />
        ))}
        <InfoPalette name="Info" id="info-palette" map={activeDocument} />
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

// // Takes in an DOM element and returns a ref for assigning to the mount location
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
