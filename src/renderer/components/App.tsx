// eslint-disable-next-line max-classes-per-file
import './App.css';
import React from 'react';
import { render } from '@testing-library/react';

// @ts-ignore
import MenuBar from './MenuBar';

class App extends React.Component {

  constructor() {
    super();

    this.state = {};
    this.documentState = {};
  }

  getState() {
    return this.state;
  }

  isDocumentOpen() {
    return this.getState()?.documents?.views?.length;
  }

  getWidgets() {
    if (!this.isDocumentOpen()) return [];
    return (
      <>
        {/* <DocumentContainer
          // key="document"
          state={this.getState()}
          dispatch={this.dispatch}
          currentTool={this.getCurrentTool()}
          unhidable
        />
        <DocumentPreview
          // key="preview"
          appState={this.getState()}
          currentTool={this.getCurrentTool()}
          appCanvas={this.getActiveCanvas().canvas}
          // minHeight={240}
        />
        <History
          // key="history"
          data={this.getActiveCanvas().history}
          dispatch={a => this.dispatch(a, this.getActiveDocument().canvas)}
          showSnapshots
        />
        <CanvasProperties
          // key="canvasProperites"
          canvas={this.getActiveCanvas()}
          dispatch={a => this.dispatch(a, this.getActiveDocument().canvas)}
        />
        <Palette
          // key="palette"
          minHeight={40}
          palette={this.getToolsState().palette}
          selected={this.getToolsState().selectedColor}
          dispatch={a => this.dispatch(a, this.getActiveDocument().canvas)}
        />
        <Layers
          // key="palette"
          minHeight={40}
          palette={this.getToolsState().palette}
          selected={this.getToolsState().selectedColor}
          dispatch={a => this.dispatch(a, this.getActiveDocument().canvas)}
        /> */}
      </>
    ).props.children;
  }

  render() {
    return (
      <div className="App" style={{
        height: "100vh", //needed for react-dockable
      }}>
          <MenuBar
            dispatch={this.dispatch}
            widgets={this.getWidgets()
              .filter(widget => !widget.props.unhidable)
              .map(widget => ({
                id: widget.props.id,
                title: widget.props.title
              }))}
            hidden={this.getState().widgets?.hidden}
          />
      </div>
    );
  }
}

class MyComponent extends React.Component {
  render() {
      return <div style={{padding: 8}}>{this.props.title}<textarea></textarea></div>;
  }
}

export default App;