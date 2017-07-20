const createEvent = require('./createEvent');

module.exports = {
    runHandlerAndNotify(actionData) {
        const { original, value, model, name, args } = actionData;
        const res = original.apply(model, [model.state].concat(args));
        model._root.$afterChildAction(model, name);
        model.$notify(model);
        actionData.value = res;
    },
    record(actionData) {
       const { value, model, name, args } = actionData;
       model._recorder.record(createEvent(model, name, args));
   },
   reducers(actionData) {
       actionData.model.state = actionData.value;
   }
};
