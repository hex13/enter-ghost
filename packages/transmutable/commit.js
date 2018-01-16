'use strict';

const { cloneAndApplyMutations } = require('./cloning');
const { Transform } = require('./legacy_transform');
const { transform, over } = require('./transform');

function legacy_Commit(mutations = [], events = [], handler) {
    if (mutations && mutations.isCommit) {
        return new legacy_Commit(mutations.mutations, events, handler);
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

function Commit(handler = () => {}, selector = x => x) {
    return {
        run(state) {
            return over(selector, handler, state);
        },
        isCommit: true
    }
}

//function Commit(commitFor);

module.exports = Commit;
