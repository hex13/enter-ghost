const {createCommandEmitter} = require('../commandemitter');

const createId = (() => {
    let lastId = ~~(Math.random()*100000);;
    return () => ++lastId;
})();

function createDoc(app, file) {
    const ee = app.createEmitter();
    //ee.setMaxListeners(50);
    const ce = createCommandEmitter(ee);
    const self = {
        id: createId(),
        file,
        clone: () => {
            const newDoc = createDoc(app, file);
            newDoc.type = self.type;
            return newDoc;
        },
        docs: [],
        //TODO
        tabs: [],
        views: [],
        add: (doc) => {
            // TODO
            //self.workspace.layout.rows[0].cells.push({doc);
            //self.recalculateSizes();  or self.emit('change')
            //
            console.log("DODAJEMY", doc);
            self.docs.push(doc)
        },
        command: (...args) => ce.command(...args),
        on: (...args) => ce.on(...args),
        // on: (e, f) => ee.on(e, f),
        emit: (e, d) => ee.emit(e, d),
        removeListener: (e, f) => ee.removeListener(e, f),
        viewAs: 'sourceCode',

        // TODO proposal
        set(prop, value) {
            // or set({prop: value}), first argument either string or Object
            app.emit('doc::change');
        }
    };


    // TODO this doesn't belong here:
    self.on('swapDocs', ({firstIndex, secondIndex}) => {
        const first = self.docs[firstIndex];
        self.docs[firstIndex] = self.docs[secondIndex];
        self.docs[secondIndex] = first;
        self.emit('change');

    });
    self.on('viewAs', (payload) => {
        self.viewAs = payload;
        self.emit('change');
    });
    return self;
}


module.exports = createDoc;
