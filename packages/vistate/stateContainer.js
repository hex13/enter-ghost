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
        if (isModel(child)) {
            child._root = root;
            child._localId = vistate.$register(root, child);
            _connectChildren(root, child, child.state);
        }
    }
}

const metadata = new WeakMap;

const Transaction = require('./transaction');


function isModel(obj) {
    return obj._root;//obj instanceof Model;
}
const ROOT_LOCAL_ID = 1;

function getProperty(state, prop) {
    if (!prop)
        return state;

    if (state.hasOwnProperty(prop)) {
        return state[prop];
    }
}

const generateId = (last => () => ++last)(0);



const vistate = {
    $register(owner, model) {
        const localId = ++owner._lastLocalId;
        owner._models.set(localId, model);
        return localId;
    },
    transaction(model, callback, tempState) {
        const transaction = new Transaction({
            onEnd: resultState => {
                Object.assign(model.state, savedState);
                Object.assign(model.state, resultState);
            }
        });
        let savedState = {};
        Object.keys(tempState).forEach(k => {
            savedState[k] = model.state[k];
        });
        Object.assign(model.state, tempState); // TODO extract as action
        return callback(transaction, model);
    },
    systems: middleware,
    defaultSystems: [
        'runHandlerAndNotify',
        'record',
        'notifier'
    ],
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
    undo(model) {
        model.getEntity().dispatch({model, name: '$undo'})
    },
    model(description, params = {}) {

        const blueprint = description;
        let model;
        if (isModel(blueprint)) {
            model = blueprint;
            if (model._INITIALIZED) return model;
        }
        model = Object.assign({}, blueprint.actions);

        model._root = model;
        model._localId = ROOT_LOCAL_ID;
        model._models = new Map;
        model._lastLocalId = model._localId;



        model._componentsById = Object.create(null);


        let methods = Object.keys(blueprint.actions||{}).concat('$subscribe');


        const componentRefs = this.defaultSystems.map(name => ({system: this.system(name)}));

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

        class Entity {
            constructor(params) {
                const entity = this;
                entity._componentRefs = params.componentRefs;
                const data = params.data;

                this.state = {};
                for (let k in data) {
                    this.state[k] = data[k]
                };
            }
            dispatch(action) {
                this._componentRefs.forEach(c => {
                    c.system.dispatch(action, c.data, vistate);
                });
            }
        }

        methods.forEach(name => {
            const original = model[name] || standardActions[name];
            if (params.use) {
                componentRefs.push.apply(componentRefs, params.use.map(system => {
                        return {system: this.system(system)};
                }));
            }

            modelApi[name]= model[name] = (...args) => {
                const actionData = { original, value: undefined, model, name, args, payload: args[0] };
                entity.dispatch(actionData);
                return actionData.value;
            }
        });
        const entity = new Entity({
            componentRefs, data: description.data
        })

        model.getEntity = () => entity;
        model.state = entity.state;

        componentRefs.forEach(c => {
            c.system.register && c.system.register(model, this);
        });

        model.blueprint = description;
        model.$localId = () => model._localId;

        // create models from properties
        for (let p in model.state) {
            const value = model.state[p];
            if (typeof value == 'function') {
                model.state[p] = value();
            }
            if (isModel(model.state[p])) {
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
                    if (isModel(item)) {
                        item._root = this;
                        item._localId = vistate.$register(this, item);
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
    Transaction,
    ROOT_LOCAL_ID,
    vistate,
    isModel,
};
