//TODO code quality. Respect Single Responsibility Principle.
const {createLayout, createLayoutFromJson} = require('../enter-ghost-layout');
const createDoc = require('../enter-ghost-doc');

const glob = require('glob');
function createWorkspace(app) {

    const workspace = createDoc(app);

    workspace.layout = createLayout(workspace); //TODO move to workspace


    Object.assign(workspace, {
        type: 'workspace',
        name: 'Workspace 1',
        docs: [
        ],
        activeDocs: [],
    });

    app.set('workspace', workspace);
    //
    app.vifi.open('workspace.json').read(contents => {
        workspace.layout = createLayoutFromJson(workspace, contents);
        workspace.activeDocs = [];

        workspace.emit('change');
    });


    app.on('doc::split', (doc) => {
        console.log("SPLIT", doc);

        const newDoc = doc.clone();
        workspace.add(newDoc);
        workspace.layout.add(newDoc);

        app.set('activeDoc', newDoc);

        workspace.emit('change');


    });

    app.on('serialize', () => {

        const serializedLayout = JSON.stringify(workspace.layout, (n, v) => {
            if (n == 'file') return v.path;
            return v;
        }, 2);
        require('fs').writeFileSync('workspace.json', serializedLayout);
    });

    workspace.on('activate', ({doc}) => {
        const cell = workspace.layout.find(doc);
        if (!cell) {
            workspace.layout.add(doc);
            app.set('activeDoc', doc);
        } else alert('there is already this doc');
    });

    workspace.on('setActiveDirectory', path => {
        app.set('activeDirectory', path);
        const resolveFiles = new Promise(resolve => {
            const t0 = Date.now();

            const fs = require('fs');
            const Path = require('path');
            const entries = [];

            const root = {
                path,
                file: app.vifi.open(path),
                children: []
            };

            const visit = (parent) => {
                const paths = fs.readdirSync(parent.path)
                    .map(path => Path.join(parent.path, path)).filter(f => {
                        const stats = fs.statSync(f);
                        return f.indexOf('node_modules') == -1;
                    });

                entries.push.apply(entries, paths);



                paths.map(path => ({
                    path,
                    file: app.vifi.open(path),
                    isDirectory: fs.statSync(path).isDirectory(),
                    children: []
                })).forEach( (child) => {
                    parent.children.push(child);
                    if (child.isDirectory) visit(child);
                });


            };

            visit(root);

            const files = entries.map(path => app.vifi.open(path))

            // (`glob` package is too slow)
            // const files = glob.sync(app.get('activeDirectory') + '/**/*.js', {
            //     ignore: '**/node_modules/**/*',
            //     //cwd: app.get('activeDirectory')
            // }).map(path => app.vifi.open(path))
            console.log("CZAS ", path,  Date.now() - t0, entries, root);
            app.set('projectRoot', root);
            resolve(files);


        });
        app.set('resolveFiles', resolveFiles);
        console.log("fOLDER", path);
    });

    workspace.open = (path) => {
        const file = app.vifi.open(path);
        const doc = createDoc(app, file);
        doc.type = 'textDocument';

        const docs = file.get('docs') || [];

        if (docs.find(d => d.file.path == path)) {

            workspace.emit('activate', {doc})
        } else {

            file.set('docs', docs.concat(doc));
            workspace.add(doc);
            workspace.layout.add(doc);
        }
        app.set('activeDoc', doc);


        return doc; // Promise.resolve(doc) ??
    };


    app.on('open', e=> {
        workspace.emit('open', e);
    });
    workspace.on('open', (e) => {
        const ctx = {};
        if (e.paths) {

            e.paths.forEach(path => {
                const file = app.vifi.open(path);
                file.stat(stats => {
                    if (stats.isDirectory()) {
                        workspace.emit('setActiveDirectory', path);
                    } else {
                        workspace.open(file);
                        ctx.file = file;
                    }
                });
            })

            setTimeout(() => {
                workspace.emit('change');  //TODO setTimeout is temporary
                e.done && e.done(ctx);
            }, 300)
            //
            // TODO optimization.emit change after all files are open (promise.all?)
            //workspace.emit('change');
        }
    });


    workspace.on('save', (e) => {
        const doc = app.get('activeDoc');

        if (doc) {
            doc.file.read(contents => {
                console.warn("SAVE FILE", contents);
            });
            doc.file.flush().then(() => {
                app.emit('saved', {
                    file: doc.file
                });
                e && e.done && e.done();
            });
        } else
            e.done && e.done({error: new Error('no active doc')});
    });


    // app.on('doc::viewAs', ({path, payload}) => {
    //     console.log("DOC VIEW", path);
    //     const doc = workspace.docs.find(doc => doc.file.path == path);
    //     if (doc) {
    //         doc.emit('viewAs', payload);
    //         workspace.emit('change');
    //     }
    // });

    app.on('do-find-in-files', ({doc, phrase}) => {

        const getMatches = (file, contents, phrase) => {
            const re = /React/g;
            let match;
            const matches = [];
            while (match = re.exec(contents)) {
                matches.push({
                    file,
                    text: contents.substring(match.index - 10, match.index + 10)
                })
            }
            return matches.length? matches : undefined;
            //return (contents || '').indexOf(phrase) != -1;
        };


        const onFiles = (err, files) => {
            console.log("find LIST",files)


            Promise.all(files
                .map(file => {
                    return file.read().then(contents => {
                        return getMatches(file, contents, phrase);
                    });
                })).then(files => files.filter(matches=>matches)).then(files => {
                    console.log("find???", files);
                    doc.items = files.reduce((items, matches) => items.concat(matches), []);
                });
        };

        console.log("DO FIND", phrase);
        // glob(app.get('activeDirectory') + '/**/*.js', {
        //     ignore: '**/node_modules/**/*',
        //     //cwd: app.get('activeDirectory')
        // }, onFiles);


        const resolveFiles = app.get('resolveFiles');
        if (resolveFiles) {
            resolveFiles.then(files => {
                console.log("@@@@",files)
                onFiles(null, files);
            })
        }



    });

    app.on('find-file', () => {
        console.log("MENU FIND FILE");
        const resolveFiles = app.get('resolveFiles');
        if (resolveFiles) {
            resolveFiles.then(files => {
                const doc = {
                    type: 'commandWindow',
                    file: app.vifi.open('ignore://whatever'),
                    files,
                    id: Math.random(),
                }
                workspace.add(doc);
                workspace.layout.add(doc);
            })
        }
    });

    app.on('find-in-files', () => {
        console.log("FIND DIRECTORY", app.get('activeDirectory'));

        const doc = {
            type: 'searchResults',
            file: app.vifi.open('ignore://whatever'),
            items: [],
            id: Math.random(),
        }
        workspace.add(doc);
        workspace.layout.add(doc);


    });

    // TODO translation menu commands into app commands
    app.on('set', (name, data) => {
        if (name == 'activeDoc') {
            const doc = data;
            if (doc) {
                workspace.activeDocs = [doc].concat(workspace.activeDocs.filter(d => d != doc));
            }
        }

    });
    app.on('command', (doc) => {
    });

  // TODO replace in all files: doc::close => close-document
    app.on('close-document', ({doc}) => {
        doc = doc || app.get('activeDoc');
        if (!doc) return;

        workspace.layout.remove(doc);
        workspace.activeDocs.shift();

        app.set('activeDoc', workspace.activeDocs[0]);
        workspace.emit('change');
    });


    return workspace;
}


module.exports = createWorkspace;
