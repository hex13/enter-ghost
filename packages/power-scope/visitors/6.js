const { getName } = require('lupa-utils');

function ObjectRepr() {
    this.props = {};
}

function Binding(identifier, value) {
    this.name = identifier.name;
    this.loc = identifier.loc;
    this.value = value;
}

Binding.prototype = {
    get props() {
        return this.value.props;
    }
};

module.exports = () => {
    return {
        Program: {
            enter(node, state) {
                state.objects = [];
                state.analysis.objects = [];
                state.analysis.declarators = [];
                state.analysis.arrays = [];
                state.analysis.thisMap = new WeakMap;
                state.thisMap = state.analysis.thisMap;
            }
        },
        ObjectExpression: {
            enter(node, state) {
                //const obj = {};
                const obj = new ObjectRepr();
                state.objects.push(obj);
            },
            exit(node, state) {
                const obj = state.objects.pop();
                const isObjectRoot = state.parent.type != 'ObjectProperty';
                if (isObjectRoot) {
                    state.analysis.objects.push(obj);
                }
                state.passValue(obj);
            }
        },
        Function: {
            enter(node, state) {

            },
            exit(node, state) {
                const func = {};
                state.passValue(func);
                state.assignThis(func, state.lastOf('objects'));
            }
        },
        ObjectMethod: {
            enter(node, state) {

            },
            exit(node, state) {
                console.log("XXXXXX",getName(node))
                const meth = {};

                const obj = state.lastOf('objects');
                state.assignThis(meth, obj);
                state.bindProperty(obj, new Binding(node.key, meth));

                // TODO api proposal:
                // const obj = state.currentObject;
                // state.assignThis(meth, obj);
                // state.setProperty(obj, getName(node), meth);

            }
        },
        ObjectProperty: {
            enter: (node, state) => state.expectValue(),
            // TODO api proposal:
            //expectValue: true,
            exit(node, state) {
                state.bindProperty(state.lastOf('objects'), new Binding(node.key, state.receiveValue()));

                // TODO api proposal
                // const binding = new Binding({
                //     name: getName(node),
                //     value: state.receiveValue(),
                //     nameLoc: node.key.loc,
                // }
                // state.createPropertyBinding(state.lastOf('objects'), binding, binding);
                // state.bindProperty(state.lastOf('objects'), binding);
                // state.bindVariable(state.lastOf('objects'), binding, binding);
            }
        },
        //declarators
        VariableDeclarator: {
            enter(node, state) {
                state.analysis.declarators.push({
                    kind: state.parent.kind,
                    name: node.id.name
                });
            },
            exit(node, state) {
            },
        },
        NumericLiteral: {
            enter(node, state) {

            },
            exit(node, state) {
                state.passValue(node.value);
            },
        },
        // arrays
        ArrayExpression: {
            enter(node, state) {
                state.expectValues();
            },
            exit(node, state) {
                state.analysis.arrays.push(state.receiveValues())
            },
        }
    }
};
