// eslint-disable-next-line max-classes-per-file
import './App.css';
import Dockable from "react-dockable";
import React from 'react';
import { render } from '@testing-library/react';

class App extends React.Component {

  constructor() {
    super();
    this.state = {
      panels: [
        {
          windows: [
            {
              selected: 0,
              widgets: ["compA","compB","compC"]
            }
          ]
        },
        {
          windows: [
            {
              selected: 0,
              widgets: ["compA","compB","compC"]
            }
          ]
        },
      ]
    };

    this.documentState = {
      
    };
  }

  render() {
    return (
      <div className="App" style={{
        height: "100vh", //needed for react-dockable
      }}>
        <Dockable
          initialState={this.state.panels}
          onUpdate={(workspace) => this.setState({panels: workspace})}
        >
          <MyComponent id="compA" title="AAA" />
          <MyComponent id="compB" title="BBB" />
          <MyComponent id="compC" title="CCC" />
        </Dockable>
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