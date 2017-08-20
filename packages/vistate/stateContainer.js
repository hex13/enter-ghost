"use strict";

const ROOT_LOCAL_ID = 1;
class Entity {
    constructor(blueprint, params) {

        this._componentsById = {};
        this._componentRefs = params.systemRefs.map(({id, system}) => {
            const componentRef = {
                system,
                data: {
                    of: (model) => model.getEntity()._componentsById[id]
                }
            };
            this._componentsById[id] = componentRef.data;
            return componentRef;
        });
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



const { Transmutable } = require('transmutable');

const middleware = require('./middleware');

const standardActions = {
    set(state, k, v) {
        state[k] = v;
    }
};

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
    function createSystemRef(system) {
        return {
            system,
            id: Symbol()
        }
    }

    const defaultSystemRefs = ['runHandlerAndNotify', 'notifier']
        .map(name => createSystemRef(middleware[name]()));

    return {
        model(blueprint, params = {}) {

            const model = {};

            model._root = model;

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

            const systemRefs = (params.use || [])
                .concat(config.use || [])
                .map(system => createSystemRef(system));

            const allSystemRefs = defaultSystemRefs.concat(systemRefs);

            const entity = new Entity(blueprint, {
                systemRefs: allSystemRefs, data: blueprint.data, api: this, model
            });
            model.getEntity = () => entity;

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



            model.$localId = () => model._localId;
            model.getId = () => model._localId;

            _connectChildren(model._root, model, entity.state);

            // TODO remove it
            model.valueOf = () => model.constructor.name;
            return model;
        },
        createCollection(params) {
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
            }, params);
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
