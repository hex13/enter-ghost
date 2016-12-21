const createDoc = require('../enter-ghost-doc');

const createCell = (doc) => ({
    doc,
    width: 600,
    height: 0, //TODO
});

exports.createLayoutFromJson = (workspace, source) => {
    return createLayout(workspace, JSON.parse(source, (name, value) => {
        if (name == 'file')
            return app.vifi.open(value);
        if (value && value.type == 'appTopBar') {
            const doc = createDoc(app);
            Object.assign(doc, value);
            doc.docs = workspace.docs; //!!! TODO temporary?
            return doc;
        }

        // TODO it should call workspace.open
        if (name == 'doc' && value.file.path.indexOf('ignore://') != 0) {
            const doc = workspace.open(value.file.path); // createDoc(app, value.file);
            return Object.assign(doc, value);
        }
        return value;
    }));
};

function createLayout(workspace, layout) {
    layout = layout || {
        rows:  [
            {height: 32, cells: [
                {
                    hidePath: true,
                    hideMenu: true,
                    doc: {
                        type: 'appTopBar',
                        get docs() {
                            return workspace.docs;
                        },
                        file: {path: 'ignore://test123.appTopBar'}
                    }
                }
            ]},
            {height: 0, cells: [
                {
                    width: 200,
                    doc: {
                        id: 'treeView',
                        type: 'treeView',
                        file: {path: 'ignore://test123.sideBar1'}
                    }
                },
                {
                    width: 1,
                    doc: {
                        type: 'placeholder',
                        file: {path: 'ignore://test123.placeholder'},
                        capacity: 0,
                        taken: 0,
                    }
                },
                {
                    width: 60,
                    doc: {
                        type: 'sideBar',
                        file: {path: 'ignore://test123.sideBar2'}
                    }
                },
            ]},
            {height: 50, cells: [
                {
                    width: 1,
                    doc: {
                        type: 'placeholder',
                        file: {path: 'ignore://test123.placeholder'}
                    }
                },
            ]},
        ]
    };
    layout.find = doc => {
        let found;
        layout.rows.find(row => {
            return found = row.cells.find(cell => cell.doc === doc);
        });
        return found;
    };
    layout.add = doc => {

        layout.rows.find(row => {
            const items = row.cells;

            const idx = items.findIndex(cell => cell.doc.type == 'placeholder');

            if (idx != -1) {
                const placeholder = items[idx].doc;

                if (!placeholder.capacity || (placeholder.capacity > placeholder.taken)) {
                    // TODO decreasing on remove
                    placeholder.taken = (placeholder.taken || 0) + 1;
                    items.splice(idx, 0, createCell(doc));
                    return true;
                }
            }
        });
    };

    layout.remove = doc => {
        // TODO remove code duplication
        layout.rows.find(row => {
            const items = row.cells;

            const idx = items.findIndex(cell => (cell.doc == doc));
            console.log("::idx", idx);
            if (idx != -1) {
                const placeholder = items[idx].doc;

                if (!placeholder.capacity || (placeholder.capacity > placeholder.taken)) {
                    // TODO decreasing on remove
                    placeholder.taken = (placeholder.taken || 0) + 1;
                    items.splice(idx, 1);
                    return true;
                }
            }
        });

    }
    return layout;
};


exports.createLayout = createLayout;
