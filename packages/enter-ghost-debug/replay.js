const CircularJSON = require('circular-json');
const stringify = CircularJSON.stringify.bind(CircularJSON);

const write = console.log.bind(console);

const createState = () => ({
    indent: 0,
    filter: '',
    functions: [],
    matchesFilter() {
        return !this.filter || this.functions[this.functions.length - 1] == this.filter;
    },
    incIndent() {
        if (!this.matchesFilter())
            return;
        this.indent += 1;
    },
    decIndent() {
        if (!this.matchesFilter())
            return;
        this.indent -= 1;
    },
});


const state = createState();

const visitorApi = {
    write,
    stringify,
    state
};



const log = (...args) => {
    if (!state.matchesFilter())
        return;
    const whitespaces = '    '.repeat(Math.max(state.indent,0));
    write(whitespaces, ...args);
};



const stateChangers = {
    func({args, name}) {
        state.incIndent();
        state.currentFunction = {
            type: 'function',
            args,
            name
        };
        state.functions.push(state.currentFunction);
    },
    ret({value}) {
        state.currentFunction = state.functions.pop();
        state.currentFunction.value = value;
    },
    after_ret() {
        state.decIndent();
    }
};


module.exports = function replay(events, createVisitor) {
    const visitor = createVisitor(visitorApi);


    if (events.length) {
        visitor.start && visitor.start();
    }

    events.forEach((e) => {
        const {type} = e;
        const visit = visitor.hasOwnProperty(type) && visitor[type];
        const changeState = stateChangers.hasOwnProperty(type) && stateChangers[type];
        const afterType = 'after_' + type;
        const changeStateAfterVisit = stateChangers.hasOwnProperty(afterType) && stateChangers[afterType];

        if (changeState) {
            changeState(e);
        }
        if (visit) {
            visit(e);
        }
        if (changeStateAfterVisit) {
            changeStateAfterVisit(e);
        }

    });

}
