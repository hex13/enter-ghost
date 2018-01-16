'use strict';

const { cloneAndApplyMutations } = require('./cloning');
const { Transform } = require('./legacy_transform');

function Commit(mutations = [], events = [], handler) {
    if (mutations && mutations.isCommit) {
        return new Commit(mutations.mutations, events, handler);
    }
    this.mutations = mutations;
    this.events = events;
    this.put = (event) => {
        this.events.push(event);
    };
    this.run = (state) => {
        if (handler) {
            this.mutations = Transform(handler).run(state).mutations;
        }
        return cloneAndApplyMutations(state, this.mutations);
    };
    this.isCommit = true;

}

module.exports = Commit;
