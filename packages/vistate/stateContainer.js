"use strict";

const ROOT_LOCAL_ID = 1;
class Entity {
    constructor(blueprint, params) {
        const entity = this;
        entity._componentRefs = params.componentRefs;
        entity._api = params.api;

        const data = params.data;
        this.state = {};
        for (let k in data) {
            this.state[k] = data[k]
        };
        this.stagedState = transmutable.fork(this.state);

        this._localId = ROOT_LOCAL_ID;
        this._models = new Map;
        this._lastLocalId = this._localId;

    }
    find(id) {
        return this._models.get(id);
    }
    dispatch(action) {
        this._componentRefs.forEach(c => {
            c.system.dispatch(action, c.data, this._api);
        });
    }
    register(model) {
        const localId = ++this._lastLocalId;
        this._models.set(localId, model);
        return localId;
    }
}


// for autocorrection
const leven = require('leven');

const transmutable = require('transmutable').transmutable();

const middleware = require('./middleware');

const standardActions = {
    set(state, k, v) {
        state[k] = v;
    }
};

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
            child._localId = root.getEntity().register(child);
            _connectChildren(root, child, child.state);
        }
    }
}

const metadata = new WeakMap;

const Transaction = require('./transaction');


function isModel(obj) {
    return obj._root;//obj instanceof Model;
}


function getProperty(state, prop) {
    if (!prop)
        return state;

    if (state.hasOwnProperty(prop)) {
        return state[prop];
    }
}

const generateId = (last => () => ++last)(0);



const vistate = {
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
    runningSystems: {

    },
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
        if (this.runningSystems.hasOwnProperty(name)) {
            return this.runningSystems[name];
        }
        const id = Symbol(name);
        if (this.systems.hasOwnProperty(name)) {
            const system = {
                system: this.systems[name](id),
                id
            };
            this.runningSystems[name] = system;
            return system;
        }
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
            model = model.getEntity().find(target);
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
        model = {};

        model._root = model;



        model._componentsById = Object.create(null);


        const componentRefs = this.defaultSystems.map(name => {
            const { system, id } =  this.system(name);
            return {
                system,
                data: this.component(model, id, {
                    of: (model) => this.component(model, id)
                })
            };
        });

        const modelApi = {};

        const queries = {
            get: getProperty
        };

        if (blueprint.queries) {
            Object.assign(queries, blueprint.queries);
        }

        for (let name in queries) {
            model[name] = (...args) => {
                return queries[name](model.state, ...args);
            }
        }


        const entity = new Entity(blueprint, {
            componentRefs, data: description.data, api: this
        });

        model._localId = entity._localId;

        Object.defineProperty(model, 'stagedState', {
            get: () => entity.stagedState,
            set: (state) => {
                entity.stagedState = state;
            }
        });
        Object.defineProperty(model, 'state', {
            get: () => entity.state,
            set: (state) => {
                entity.state = state;
            }
        })


        let methods = Object.keys(blueprint.actions||{}).concat('$subscribe', 'set');

        const actions = blueprint.actions || {};
        methods.forEach(name => {
            const original = actions[name] || standardActions[name];
            if (params.use) {
                componentRefs.push.apply(componentRefs, params.use.map(system => {
                        return {system: this.system(system).system};
                }));
            }

            model[name] = (...args) => {
                const actionData = { original, value: undefined, model, name, args, payload: args[0] };
                entity.dispatch(actionData);
                return actionData.value;
            }
        });

        model.getEntity = () => entity;


        componentRefs.forEach(c => {
            c.system.register && c.system.register(model, c.data, this);
        });

        model.blueprint = description;
        model.$localId = () => model._localId;
        model.getId = () => model._localId;

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
            queries: {
                get(state) {
                    return state.list;
                }
            },
            actions: {
                add(state, item) {
                    state.list.push(item);
                    // TODO connect list item
                    if (isModel(item)) {
                        item._root = this;
                        item._localId = this.getEntity().register(item);
                    }

                },
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
