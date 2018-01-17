'use strict';

const { transform, over } = require('./transform');

function Commit(handler = () => {}, selector = x => x) {
    return {
        run(state) {
            return over(selector, handler, state);
        },
        isCommit: true
    }
}

module.exports = Commit;
