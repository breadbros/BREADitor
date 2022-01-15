import * as React from 'react';
import Dockable from '../../../../react-dockable/src';
import './css/App.css';

// hiddel element to contain non-react UI
const hiddenEl = document.createElement('div');
hiddenEl.style.display = 'none';
document.body.appendChild(hiddenEl);

// test non-react UI to later mount into react components
const TestUI_A = document.createElement('div');
const TestUI_B = document.createElement('div');
TestUI_A.innerHTML = 'hello world';
TestUI_B.innerHTML = 'cheese poop';
hiddenEl.appendChild(TestUI_A);
hiddenEl.appendChild(TestUI_B);

class App extends React.Component {
  state = {
    panels: [
      {
        windows: [
          {
            selected: 0,
            widgets: ['TestA', 'TestB']
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
          <ComponentA id="TestA" title="Test A" />
          <ComponentB id="TestB" title="Test B" />
        </Dockable>
      </div>
    );
  }
}

type MyProps = {
  id: string;
  title: string;
};

class ComponentA extends React.Component<MyProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.appendChild(TestUI_A);
  }

  componentWillUnmount() {
    hiddenEl.appendChild(TestUI_A);
  }

  render() {
    return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
  }
}

class ComponentB extends React.Component<MyProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.appendChild(TestUI_B);
  }

  componentWillUnmount() {
    hiddenEl.appendChild(TestUI_B);
  }

  render() {
    return <div style={{ padding: 8 }} ref={this.containerRef}></div>;
  }
}

export default App;
