const createEvent = require('./createEvent');

module.exports = {
    runHandlerAndNotify(actionData) {
        const { original, value, model, name, args } = actionData;
        if (name.charAt(0) == '$') return;
        const res = original.apply(model, [model.state].concat(args));
        model._root.$afterChildAction(model, name);
        model.$notify(model);
        actionData.value = res;
    },
    record(actionData, data, api) {
       const { value, model, name, args } = actionData;
       const recorder = api.component(api.root(model), 'recorder');
       if (name == '$undo') {
           const tmp = api.model(new model.constructor());
           recorder.undo(event => {
               api.dispatch(tmp, event);
           });

           model.state = tmp.get();
           model.$notify(model);
           return;
       }

       recorder.record(createEvent(model, name, args));
   },
   reducers(actionData) {
       actionData.model.state = actionData.value;
   }
};
