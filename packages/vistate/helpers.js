const leven = require('leven');
const Transaction = require('./transaction');
//const ROOT_LOCAL_ID = 1;

function correct(phrase, texts) {
    phrase = phrase.toLowerCase();
    return texts
        .map(t => [t,leven(t.toLowerCase(), phrase)])
        .sort((a,b)=>{return a[1]-b[1]})[0][0];
}

exports.autocorrect = (model, methodName) => {
    const props = Object.keys(model);
    return correct(methodName, props);
};

exports.dbg = model => JSON.stringify(model.get());

exports.root = model => model._root;

exports.transaction = (model, callback, tempState) => {
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
}


// Functions below are not tested. (Tests are skipped):
// TODO
// 1. turn on testing
// 2. uncomment
// 3. restore these features (I may demand some thinking about "how")


// exports.reset = (model) => {
//     model.$reset();
// };

// exports.undo = (model) => {
//     model.getEntity().dispatch({model, name: '$undo'})
// };
