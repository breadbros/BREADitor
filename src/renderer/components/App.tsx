import * as React from 'react';
import Dockable from '../../../../react-dockable/src';
import './css/App.css';
import { oldBootstrap } from '../../old_bootstrap.js';

oldBootstrap();


// hiddel element to contain non-react UI
const hiddenEl = document.createElement('div');
hiddenEl.style.display = 'none';
document.body.appendChild(hiddenEl);

const toolPallete = document.getElementsByClassName('tool-palette')[0];
const layersPallete = document.getElementsByClassName('layers-palette')[0];
const zonesPallete = document.getElementsByClassName('zones-palette')[0];
const mapPallete = document.getElementsByClassName('map-palette')[0];
const infoPallete = document.getElementsByClassName('info-palette')[0];
const entityPallete = document.getElementsByClassName('entity-palette')[0];
const screenviewToolPallete = document.getElementsByClassName('screenview-indicator-palette')[0];
const tilesetViewPallete = document.getElementsByClassName('tileset-selector-palette')[0];


class App extends React.Component {
  state = {
    panels: [
      {
        windows: [
          {
            selected: 0,
            widgets: ['ToolPanel', 'LayerPanel', 'ZonePanel', 'MapDocument_0', 'MapInfoPanel', 'EntityPanel', 'ScreenviewIndicatorPanel', 'TilesetSelectorPalette']
          }
        ]
      }
    ]
  };

  render() {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh'
        }}
      >
        <Dockable
          initialState={this.state.panels}
          onUpdate={workspace => this.setState({ panels: workspace })}
          spacing={3}
        >
          <ComponentA id="ToolPanel" title="Tools" />
          <ComponentB id="LayerPanel" title="Layers" />
          <ComponentC id="ZonePanel" title="Zones" />
          <ComponentMap id="MapDocument_0" title="" />
          <ComponentD id="MapInfoPanel" title="Map Info" />
          
          <ComponentE id="EntityPanel" title="Entities" />
          <ComponentF id="ScreenviewIndicatorPanel" title="Screenview Tool" />
          <ComponentG id="TilesetSelectorPalette" title="Tileset Viewer" />
        </Dockable>
      </div>
    );
  }
}

type MyProps = {
  id: string;
  title: string;
};


class ComponentG extends React.Component<MyProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
      this.containerRef.current?.appendChild(tilesetViewPallete);
  }

  componentWillUnmount() {
      hiddenEl.appendChild(tilesetViewPallete);
  }

  render() {
      return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
  }
}

class ComponentF extends React.Component<MyProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
      this.containerRef.current?.appendChild(screenviewToolPallete);
  }

  componentWillUnmount() {
      hiddenEl.appendChild(screenviewToolPallete);
  }

  render() {
      return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
  }
}

class ComponentE extends React.Component<MyProps> {
    containerRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.containerRef.current?.appendChild(entityPallete);
    }

    componentWillUnmount() {
        hiddenEl.appendChild(entityPallete);
    }

    render() {
        return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
    }
}


class ComponentA extends React.Component<MyProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.appendChild(toolPallete);
  }

  componentWillUnmount() {
    hiddenEl.appendChild(toolPallete);
  }

  render() {
    return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
  }
}

class ComponentB extends React.Component<MyProps> {
    containerRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.containerRef.current?.appendChild(layersPallete);
    }

    componentWillUnmount() {
        hiddenEl.appendChild(layersPallete);
    }

    render() {
        return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
    }
}

class ComponentC extends React.Component<MyProps> {
    containerRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.containerRef.current?.appendChild(zonesPallete);
    }

    componentWillUnmount() {
        hiddenEl.appendChild(zonesPallete);
    }

    render() {
        return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
    }
}

class ComponentMap extends React.Component<MyProps> {
    containerRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.containerRef.current?.appendChild(mapPallete);
    }

    componentWillUnmount() {
        hiddenEl.appendChild(mapPallete);
    }

    render() {
        return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
    }
}

class ComponentD extends React.Component<MyProps> {
    containerRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.containerRef.current?.appendChild(infoPallete);
    }

    componentWillUnmount() {
        hiddenEl.appendChild(infoPallete);
    }

    render() {
        return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
    }
}

export default App;
