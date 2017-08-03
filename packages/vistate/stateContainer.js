"use strict";

const ROOT_LOCAL_ID = 1;
class Entity {
    constructor(blueprint, params) {
        this._componentRefs = params.componentRefs;
        this._api = params.api;

        this._localId = ROOT_LOCAL_ID;
        this._models = new Map;
        this._lastLocalId = this._localId;
        this._model = params.model;
        this.blueprint = blueprint;

        this._registerComponents();
        this._initState(params.data);
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
    _initState(data) {
        const state = {};
        for (let k in data) {
            const value = data[k];
            if (typeof value == 'function') {
                state[k] = value();
            } else {
                state[k] = value;
            }
        };

        this.state = state;
        this.stagedState = new Transmutable(state);
    }
    _registerComponents() {
        this._componentRefs.forEach(c => {
            c.system.register && c.system.register(this._model, c.data, this._api);
        });
    }
}


// for autocorrection
const leven = require('leven');

const { Transmutable } = require('transmutable');

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
            _connectChildren(root, child, child.getEntity().state);
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



const init = (config = {}) => {
    return {
        transaction(model, callback, tempState) {
            const transaction = new Transaction({
                onEnd: resultState => {
                    Object.assign(model.getEntity().state, savedState);
                    Object.assign(model.getEntity().state, resultState);
                }
            });
            let savedState = {};
            Object.keys(tempState).forEach(k => {
                savedState[k] = model.getEntity().state[k];
            });
            Object.assign(model.getEntity().state, tempState); // TODO extract as action
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
            return JSON.stringify(model.get());
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
        system(nameOrFactory) {
            if (typeof nameOrFactory == 'function') {
                const system = {
                    system: nameOrFactory()
                };
                return system;

            } else {
                const name = nameOrFactory;
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
        model(blueprint, params = {}) {

            const model = {};

            model._root = model;

            model._componentsById = Object.create(null);

            const componentRefs = this.defaultSystems
                .concat(params.use || [])
                .concat(config.use || [])
                .map(nameOrFactory => {
                    const { system, id } =  this.system(nameOrFactory);
                    return {
                        system,
                        data: this.component(model, id, {
                            of: (model) => this.component(model, id),
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
                    return queries[name](model.getEntity().state, ...args);
                }
            }

            const entity = new Entity(blueprint, {
                componentRefs, data: blueprint.data, api: this, model
            });

            model._localId = entity._localId;

            let methods = Object.keys(blueprint.actions||{}).concat('$subscribe', 'set');

            const actions = blueprint.actions || {};

            methods.forEach(name => {
                const original = actions[name] || standardActions[name];

                model[name] = (...args) => {
                    const actionData = { original, value: undefined, model, name, args, payload: args[0] };
                    entity.dispatch(actionData);
                    return actionData.value;
                }
            });

            model.getEntity = () => entity;

            model.$localId = () => model._localId;
            model.getId = () => model._localId;

            _connectChildren(model._root, model, entity.state);
            model._metadata = {type: blueprint.type};
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
    }
}

module.exports = {
    Transaction,
    ROOT_LOCAL_ID,
    init,
    isModel,
};
