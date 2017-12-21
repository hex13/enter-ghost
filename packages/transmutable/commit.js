'use strict';

function Commit(mutations = [], events = []) {
    this.mutations = mutations;
    this.events = events;
    this.put = (event) => {
        this.events.push(event);
    };
}

module.exports = Commit;
