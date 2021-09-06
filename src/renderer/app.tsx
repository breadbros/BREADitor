import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AppContainer } from 'react-hot-loader';

import Dockable from 'react-dockable';
import App from './components/App';
import store from './store';
import { oldBootstrap } from '../old_bootstrap.js';



// oldBootstrap();

// Create main element
const mainElement = document.createElement('div');
mainElement.id = 'root';
document.body.appendChild(mainElement);

// Render components
// const render = (Component: () => JSX.Element) => {
//     ReactDOM.render(
//         <h1>I am definitely REACT</h1>,
//         mainElement
//     );
// };

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

//render(App);
