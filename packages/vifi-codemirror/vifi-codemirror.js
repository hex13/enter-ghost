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


const vifi = require('vifi/2');

class CodeMirrorFile extends vifi.File {
    constructor(path, contents, cm) {
        super(path, contents);
        this._cm = cm;
    }
    read() {
        return Promise.resolve(this._cm.getValue());
    }
    write(contents) {
        return Promise.resolve(contents).then(contents => {
            this._cm.setValue(contents);
        });
    }
}


exports.createEditor = function createEditor({el, suggest, injectStyles}) {
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

    let promisedFile;
    function open (file) {
        promisedFile = file.snapshot({cls: CodeMirrorFile, extra: [cm]});
    }

    let fileProxy = new vifi.File;
    fileProxy.proxy(() => promisedFile);

    return { cm, open, file: fileProxy };

}
