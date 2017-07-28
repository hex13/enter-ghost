"use strict";


// for autocorrection
const leven = require('leven');

const transmutable = require('transmutable').transmutable();

const middleware = require('./middleware');

function correct(phrase, texts) {
    phrase = phrase.toLowerCase();
    return texts
        .map(t => [t,leven(t.toLowerCase(), phrase)])
        .sort((a,b)=>{return a[1]-b[1]})[0][0];
}

function _connectChildren(root, model, data) {
    for (let prop in data) {
        let child = data[prop];
        if (child instanceof Model) {
            child._root = root;
            child._localId = root.$register(child);
            _connectChildren(root, child, child.state);
        }
    }
}

const metadata = new WeakMap;

const Transaction = require('./transaction');


const ROOT_LOCAL_ID = 1;
// `constructor` is ES6 class constructor (inb4: thank you captain obvious XD).
// methods beginning with `$`` are helpers
// methods beginning with `get` are getters
// methods beginning with `_` are private methods
// rest of methods are actions
// only actions are recorded.

function _getProps(obj) {
    const props = {};
    let curr = obj;
    for (let curr = obj; curr && curr !== Object.prototype; curr = curr.__proto__) {
        Object.getOwnPropertyNames(curr).forEach(k => {
            if (!props.hasOwnProperty(k)) props[k] = true;
        });
    }
    return Object.keys(props);
}

class Model {
    constructor(...args) {
        this._initialArgs = args;
        this._root = this;
        this._localId = ROOT_LOCAL_ID;
        this._models = new Map;
        this._lastLocalId = this._localId;
    }
    $localId() {
        return this._localId;
    }
    $register(model) {
        const localId = ++this._lastLocalId;
        this._models.set(localId, model);
        return localId;
    }
    $transaction(callback, tempState) {
        const transaction = new Transaction({
            onEnd: resultState => {
                Object.assign(this.state, savedState);
                Object.assign(this.state, resultState);
            }
        });
        let savedState = {};
        Object.keys(tempState).forEach(k => {
            savedState[k] = this.state[k];
        });
        Object.assign(this.state, tempState); // TODO extract as action
        return callback(transaction, this);
    }
};

function getProperty(state, prop) {
    if (!prop)
        return state;

    if (state.hasOwnProperty(prop)) {
        return state[prop];
    }
}

const generateId = (last => () => ++last)(0);



const vistate = {
    systems: middleware,
    //systemInstances: Object.create(null),
    dbg(model) {
        return JSON.stringify(model.state);
    },
    events(model) {
        return this.component(this.root(model), 'events').filter(event => {
            return this.root(model) == model || event.target == model.$localId();
        });
    },
    component(model, id, value) {
        const componentsById = model._componentsById;
        if (value !== undefined) {
            componentsById[id] = value;
        }
        return componentsById[id];
    },
    system(name) {
        if (this.systems.hasOwnProperty(name)) return this.systems[name]();
    },
    root(model) {
        return model._root;
    },
    reset(model) {
        model.$reset();
    },
    autocorrect(model, methodName) {
        const props = Object.keys(model);
        return correct(methodName, props);
    },
    dispatch(model, {target, type, args}) {
        if (target && target != ROOT_LOCAL_ID ) {
            model = model._models.get(target);
        }
        model[type](...args);
    },
    dispatchToSystems(model, action) {
        model._componentRefs.forEach(c => {
            c.system.dispatch(action, c.data, vistate);
        });
    },
    undo(model) {
        this.dispatchToSystems(model, {model, name: '$undo'});
    },
    model(description, params = {}) {
        let model;
        if (description instanceof Model) {
            model = description;
            if (model._INITIALIZED) return model;
        } else {
            class AdHocModel extends Model {
            }
            for (let k in description.actions) {
                AdHocModel.prototype[k] = description.actions[k];
            }
            model = new AdHocModel();
        }

        model._componentsById = Object.create(null);



        let methods = _getProps(model.__proto__)
            .filter(n => n != 'constructor'
                && n.charAt(0) != '$'
                && n.charAt(0) != '_'
                && n.indexOf('get') != 0
            ).concat('$subscribe');

        const componentRefs = [
            {system: this.system('runHandlerAndNotify')},
            {system: this.system('record')},
            {system: this.system('notifier')},
        ];

        const modelApi = {};

        const queries = {
            get: model.get || getProperty
        };
        for (let name in queries) {
            model[name] = (...args) => {
                return queries[name](model.state, ...args);
            }
        }

        const standardActions = {
            set(state, k, v) {
                state[k] = v;
            }
        };
        methods.push('set');
        methods.forEach(name => {
            const original = model[name] || standardActions[name];
            if (params.use) {
                componentRefs.push.apply(componentRefs, params.use.map(system => {
                        return {system: this.system(system)};
                }));
            }

            modelApi[name ]= model[name] = (...args) => {
                const actionData = { original, value: undefined, model, name, args, payload: args[0] };
                this.dispatchToSystems(model, actionData)
                return actionData.value;
            }
        });

        model._componentRefs = componentRefs;

        componentRefs.forEach(c => {
            c.system.register && c.system.register(model, this);
        });

        model.state = (()=>{
            const state = {};
            for (let k in description.data) {
                state[k] = description.data[k]
            };
            return state;
        })();
        model.blueprint = description;

        // create models from properties
        for (let p in model.state) {
            const value = model.state[p];
            if (typeof value == 'function') {
                model.state[p] = value();
            }
            if (model.state[p] instanceof Model) {
                model.state[p] = vistate.model(model.state[p])
            }
        }

        model.stagedState = transmutable.fork(model.state);

        _connectChildren(model._root, model, model.state);
        model._INITIALIZED = true;
        model._metadata = {type: description.type};
        // TODO remove it
        model.valueOf = () => model.constructor.name;
        return model;
    },
    metadata(model, md) {
        if (md) {
            metadata.set(model, md);
            return
        }
        return model._metadata || metadata.get(model);
    },
    collection() {
        return this.model({
            data: {
                list: []
            },
            actions: {
                add(state, item) {
                    state.list.push(item);
                    // TODO connect list item
                    if (item instanceof Model) {
                        item._root = this;
                        item._localId = this.$register(item);
                    }

                },
                get(state) {
                    return state.list;
                }
            }
        });
    },
    delegateTo(childName, methodName) {
        return (state) => {
            if (state.hasOwnProperty(childName)) {
                const model = state[childName];
                console.log("######TG", model[methodName]());
            }

        }
    }
};

module.exports = {
    Model,
    Transaction,
    ROOT_LOCAL_ID,
    vistate,
};
