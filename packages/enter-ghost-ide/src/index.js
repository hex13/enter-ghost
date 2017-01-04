// import React from 'react';
// import ReactDOM from 'react-dom';
// import Workspace from './components/Workspace';
// import {asyncComponent} from './components/asyncComponent';
 const createWorkspace = require('../../enter-ghost-workspace');
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
const log = console.log.bind(console);
const babel = require('babel-core');

const glob = require('glob');

const Path = require('path');
const files = glob.sync(__dirname + '/../../enter-ghost-transform/mocks/*');
files.forEach(path => {

    console.log("zzaa", path);
    const destPath = Path.join(
        __dirname,
        '/../../enter-ghost-transform/build/',
        Path.relative(__dirname + '/../../enter-ghost-transform/mocks/', path)
    );
    console.log("DDDDZZ", destPath);
    const source = require('fs').readFileSync(path, 'utf8');
    const code = babel.transform(source, {
        plugins: [require('../../enter-ghost-transform/transform')]
    }).code;
    console.log("DDDDZZ", destPath, code);

    require('fs').writeFileSync(destPath, code);
});
console.log("FFFFF",files)


//const runningModule = require('../../enter-ghost-transform/build/example.js');

setTimeout(() => {
    const guiPath = window.app.get('guiPath') || 'enter-ghost-gui-snabbdom';
    require(guiPath)(document.getElementById('workspace'));

    // const debugView = require('../../enter-ghost-debug/gui/bundle');
    // log("ssssR");
    // const dbg = require('../../enter-ghost-debug');
    // log("RRRRRRRR", dbg.getEvents());
    // const events = dbg.getEvents();



    //const events = require('../../enter-ghost-debug/gui/events.json').events;
    // debugView({
    //     data: { events },
    //     el: document.getElementById('workspace')
    // });
}, 500)


require('../../enter-ghost-service-loader')(window.app);
