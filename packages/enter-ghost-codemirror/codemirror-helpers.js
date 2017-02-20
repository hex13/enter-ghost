const CodeMirror = require('codemirror');

// Code Mirror modes
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/htmlmixed/htmlmixed');

//require('codemirror/addon/mode/multiplex');
require('codemirror/addon/runmode/runmode');


// key map
require('codemirror/keymap/sublime.js');


// autocomplete
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/search/search');

// CodeMirror.defineMode('search-results', (config) => {
//     return CodeMirror.multiplexingMode(
//         CodeMirror.getMode(config, 'text/javascript'),
//         {
//             open: '`',
//             close: '`',
//             mode: CodeMirror.getMode(config, 'text/html'),
//             innerStyle: 'keyword',
//             delimStyle: 'keyword',
//         }
//     )
// });

exports.highlightElement = (el) => {
    el.classList.add("cm-s-material");
    CodeMirror.runMode(el.innerHTML, el.getAttribute('data-mode'), el);
};


const getCMDoc = exports.getCMDoc = (() => {
    const cmMasterDocs = new Map;
    return (file, contents) => {
        if (cmMasterDocs.get(file)) {
            console.log(`link cm doc for ${file.path}`);
            return cmMasterDocs.get(file).linkedDoc();
        } else {
            console.log(`create cm doc for ${file.path}`);
            const cmDoc = CodeMirror.Doc(contents);
            cmMasterDocs.set(file, cmDoc);
            return cmDoc;
        }
    }
})();

exports.createCodeMirror = function createCodeMirror({el, suggest, injectStyles}) {
    if (injectStyles) [
        __dirname + "/node_modules/codemirror/lib/codemirror.css",
        __dirname + "/node_modules/codemirror/theme/material.css",
        __dirname + "/node_modules/codemirror/addon/hint/show-hint.css",
    ].forEach(path => {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = path;
        document.body.appendChild(style);
    })


    console.log("CREATE CODE MIRROR");
    const autocompleteOptions = {
        extraKeys: {"Ctrl-Space": "autocomplete"},
        hintOptions: {
            hint: suggest
        }
    };

    const options = Object.assign(
        {
            keyMap: 'sublime',
            lineNumbers: true,
            theme: 'material',
        },
        autocompleteOptions,
        {
            gutters: ['eg-gutter-vcs']
        }
    );

    const cm = CodeMirror(el, options);
    setTimeout(() => {
        cm.refresh();
    }, 50);
    return cm;

}

// TODO maybe WeakMap?
const handlersByDoc = new Map;

const prepareDoc = (doc, cm) => {
    const {file} = doc;

    const fileInterface = {
        read: () => Promise.resolve(cm.getValue())
    };

    file.read().then(contents => {
        const cmDoc = getCMDoc(file, contents);
        cm.swapDoc(cmDoc);
        cm.setOption('mode', file.mime());

        file.oldRead = file.read;

        const {vifi} = window.app;

        vifi.acquire(file, fileInterface, {force: true, owner: doc});

        cm.refresh();
    });
}

// opens enter-ghost document (not CodeMirror document!) and bind it to CodeMirror instance
exports.openDoc = function openDoc(doc, cm) {
    const {file} = doc;

    const goTo = ({line}) => {
        alert('go to')
        // TODO CodeMirror docs associaced with app level docs
        cm.getDoc().setCursor({
            line: line - 1,
            ch: 0
        });
    };

    // TODO optimization: diff marker next/prev before applying!
    const markers = []; // this is already in CM

    const refresh = () => {
        file.query('lint').then(messages => {
            markers.forEach(marker => {
                marker.clear();
            });


            //this.removeWidgets();
            messages.forEach(msg => {
                //setTimeout(() => {
                    markers.push(cm.getDoc().markText(
                        {line: msg.line - 1, ch: 0},
                        {line: msg.line, ch: 0},
                        {className: 'marked'}
                    ));
                    //this.addWidget({line: msg.line - 1, ch: msg.column}, msg.message)
                //}, 100);

            });
            cm.refresh();

        });

        file.query('vcs').then(diffs => {

            //this.setState({modifiedInVcs: diffs && diffs.length});
            cm.clearGutter('eg-gutter-vcs');

            diffs && diffs.forEach(diff => {
                const createMarker = (mode) => {
                    const el = document.createElement('div');
                    //el.className = 'eg-gutter-vcs';
                    el.innerHTML = mode;
                    return el;
                }
                // TODO remove gutters
                let mode = '';
                if (diff.newLines > 0 && diff.oldLines == 0)
                    mode = '+';
                else if (diff.oldLines > 0 && diff.newLines == 0)
                    mode = '-';
                else
                    mode = '±';
                if (mode == '-') {
                    cm.setGutterMarker(diff.newStart - 1, 'eg-gutter-vcs', createMarker(mode));
                }
                else for (let line = diff.newStart; line < diff.newStart + diff.newLines; line++) {
                    cm.setGutterMarker(line -1, 'eg-gutter-vcs', createMarker(mode));
                }

                // TODO after updating CodeMirror:
                // https://github.com/codemirror/CodeMirror/issues/4369

            })

        });
    }

    const focus = () => {
        window.app.set('activeDoc', doc);
        file.touch();
        console.log("TOUCH", file.path);
    };


    prepareDoc(doc, cm);

    handlersByDoc.set(doc, {
        goTo, refresh, focus
    });

    doc.on('goTo', goTo);
    doc.on('refresh', refresh);
    cm.on('focus', focus);


    // TODO something like that:
    // doc.on('activate')
    // it doesn't work anyway
    window.app.on('set', (name, value) => {
        // TODO prevent multiple calling if it appears
        if (name == 'activeDoc') {
            if(value == doc) {
                console.log("FOKUS", doc.file.path)
                cm.focus();
            }
        }
    });
}

exports.closeDoc = (doc, cm) => {
    const {file} = doc;

    const handlers = handlersByDoc.get(doc);

    Object.keys(handlers).forEach(name => {
        doc.removeListener(name, handlers[name]);
    });

    if (file.acquired) {
        // TODO move this logic to vifi (stringify when releasing...)
        window.app.vifi.release(file);
        // doc.file.read = doc.file.oldRead;
        // doc.file.oldRead = undefined;

        file.contents = cm.getValue();
    }

};

// exports.listenToDocEvents = function openDoc(doc, cm) {
//     proxy.on('goTo')
// };
