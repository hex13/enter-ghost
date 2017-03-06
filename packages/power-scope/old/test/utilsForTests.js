const traverse = require('../traverse');
const vfs = require('vifi');

const code = `
    const o = {
        child: {
            grandchild: 1234
        },
        secondChild: 'cat',
        foo: function() {
            const abc = 'alpha';
        },
        meth() {

        }
    };
    const m = {name: require('animal')};
`;

const fileMock = vfs.File({path: 'main.js', contents: code});

function prepare(filenames) {
    let unmount;
    let files;
    if (filenames) {
         files = filenames.map(f => vfs.open(f));
    }
    else {
        unmount = vfs.mountFromArray([
            {path: 'animal', contents: 'module.exports = {animal: require("bear")}'},
            {path: 'bear', contents: 'module.exports = {a: "bear"}'},
        ]);
        files = [fileMock];
    }
    const result = traverse(files, (from, path) => path, vfs);
    return result.then(result => {
        unmount && unmount();
        return result;
    });
}

exports.prepare = prepare;

function time() {
    const t0 = Date.now();
    return () => d = Date.now() - t0;
}

exports.time = time;
