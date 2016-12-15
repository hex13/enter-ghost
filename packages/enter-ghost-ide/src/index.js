// import React from 'react';
// import ReactDOM from 'react-dom';
// import Workspace from './components/Workspace';
// import {asyncComponent} from './components/asyncComponent';
 import createWorkspace from '../../enter-ghost-workspace';
//
// import Test from './components/Test';
//
//
// import {DragDropContext} from 'react-dnd';
// import HTML5Backend from 'react-dnd-html5-backend';
//
// import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
// import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
// import getMuiTheme from 'material-ui/styles/getMuiTheme';
// import injectTapEventPlugin from 'react-tap-event-plugin';
//
// injectTapEventPlugin();
//
//
// const App = () => {
//     return <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
//         <Workspace workspace={workspace} app={window.app}/>
//     </MuiThemeProvider>;
// };
//

const workspace = createWorkspace(window.app);
window.workspace = workspace;



// ReactDOM.render(
//     <App />,
//     document.getElementById('workspace'));

setTimeout(() => {
    require('../../enter-ghost-gui-vue')(document.getElementById('workspace'));
}, 500)


require('../../enter-ghost-service-loader')(window.app);
