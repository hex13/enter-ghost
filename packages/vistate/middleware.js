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

                model._root.$afterChildAction(model, name);
                actionData.value = res;
            }
        }
    },
    record() {
        return {
            register(model, api) {
                api.component(model, 'events', []);
            },
            dispatch(actionData, data, api) {
               const { value, model, name, args } = actionData;
               const events = api.component(api.root(model), 'events');
               if (name == '$undo') {
                   const tmp = api.model(new model.constructor());
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
   notifier() {
       return {
           dispatch({ model, changed }) {
               if (changed) {
                   model._root.ee.emit('change', model);
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
