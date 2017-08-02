const createEvent = require('./createEvent');
const transmutable = require('transmutable').transmutable();

const systems = {
    runHandlerAndNotify() {
        return {
            dispatch(actionData) {
                const { original, value, model, name, args } = actionData;
                if (name.charAt(0) == '$') return;

                const res = original.apply(model, [model.stagedState.stage].concat(args));
                const oldState = model.state;

                actionData.mutations = model.stagedState.mutations.slice();
                model.state = model.stagedState.commit();

                if (oldState !== model.state) {
                    actionData.changed = true;
                }

                actionData.value = res;
            }
        }
    },
    record() {
        return {
            register(model, data, api) {
                api.component(model, 'events', []);
            },
            dispatch(actionData, data, api) {
               const { value, model, name, args } = actionData;
               const events = api.component(api.root(model), 'events');
               if (name == '$undo') {
                   const tmp = api.model(model.blueprint);
                   events.pop();
                   events.forEach(event => api.dispatch(tmp, event))
                   model.state = tmp.get();
                   actionData.changed = true;
                   return;
               } else if (name.charAt(0) == '$') return;

               const event = createEvent(model, name, args);
               events.push(event);
               api.metadata(event, actionData);

            }
        }
   },
   notifier(id) {
       return {
           register(model, data, api) {
               data.observers = [];
               data.timeout = null;
           },
           dispatch({ model, changed, name, payload: f }, data, api) {
               if (typeof window != 'undefined') window.doAction && window.doAction();

                if (name == '$subscribe') {
                    // concat instead of push, to avoid mutation of observers array
                   data.observers = data.observers.concat(f);
                   return;
                }
                if (changed && !data.timeout) {
                    const modelCurrentObservers = data.observers;
                    const rootCurrentObservers = data.of(model._root).observers;
                    data.timeout = setTimeout(() => {
                        modelCurrentObservers.forEach(f => f(model));
                        if (model._root != model) {
                            rootCurrentObservers.forEach(f => f(model));
                        }
                        data.timeout = null;
                    }, 0);
               }
           }
       }
   },
   reducers() {
       return {
           dispatch(actionData) {
               const { model } = actionData;
               model.stagedState = transmutable.fork(actionData.value);
               model.state = model.stagedState.commit();
           }
       }
   }
};
module.exports = systems;
