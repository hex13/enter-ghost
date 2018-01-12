'use strict';

const { cloneAndApplyMutations } = require('./cloning');

function Commit(mutations = [], events = []) {
    this.mutations = mutations;
    this.events = events;
    this.put = (event) => {
        this.events.push(event);
    };
    this.run = (state) => {
        return cloneAndApplyMutations(state, this.mutations);
    };
    this.isCommit = true;

}

module.exports = Commit;
