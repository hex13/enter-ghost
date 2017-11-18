const getters = require('./getters');
const services = require('./services')(getters);

const Query = require('./query');

module.exports = function createQuery () {
    return new Query(Object.assign({}, services, getters, {
    }));
};
