const createEvent = require('./createEvent');


const systems = {
    runHandlerAndNotify() {
        return {
            dispatch(actionData) {
                const { original, value, model, name, args } = actionData;
                if (name.charAt(0) == '$') return;
                const res = original.apply(model, [model.state].concat(args));
                model._root.$afterChildAction(model, name);
                model.$notify(model);
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
                   model.$notify(model);
                   return;
               } else if (name.charAt(0) == '$') return;

               events.push(createEvent(model, name, args));
            }
        }
   },
   reducers() {
       return {
           dispatch(actionData) {
               actionData.model.state = actionData.value;
           }
       }
   }
};
module.exports = systems;
