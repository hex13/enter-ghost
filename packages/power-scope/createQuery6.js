const getters = require('./getters6');
const services = require('./services')(getters);

const Query = require('./query');

module.exports = function createQuery () {
    return new Query(Object.assign({}, services, getters, {
        resolveRef(ref) {
            let currScope = ref[0].scope;
            const name = ref[0].key;
            let variable = services.lookupEntry(currScope, name);
            return getters.getProperty(variable, ref.slice(2).map(k=>k.key).join(''));
        }
    }));
}
