"use strict";

const createStage = require('./legacy_createStage');

const Commit = require('./commit');
const { Stream } = require('./stream');

const errorChecks = {
    Transmutable: {
        commit(commit) {
            if (!commit.isCommit) throw new Error('Wrong argument passed to method Transmutable::commit()')
        }
    }
}

class State {
    constructor(o, hooks = {}) {
        this.state$ = Stream();
        this.target = o;
        this.commits = [];
        this.hooks = hooks;
    }
    get() {
        return this.target;
    }
    run(handler) {
        return this.commit(new Commit(null, null, handler));
    }
    commit(commit = new Commit) {
        errorChecks.Transmutable.commit(commit);

        const prevTarget = this.target;

        this.target = commit.run(this.target);

        this.state$.publish(this.target, prevTarget);

        this.commits.push(commit);
        this.hooks.onCommit && this.hooks.onCommit(this, commit);
        return this.target;
    }
    observe(...args) {
        const handler = typeof args[0] == 'function'? args[0] : args[1];
        const path = typeof args[0] == 'function'? null : args[0];
        return this.state$.select(path).subscribe(handler);
    }
    fork() {
        const t = new State(this.target);
        t.commits = this.commits.slice();
        return t;
    }
    merge(transmutable) {
        // TODO proposal:
        // const track = new Track();
        for (let i = 0; i < transmutable.commits.length; i++) {
            if (this.commits.includes(transmutable.commits[i])) continue;

            // TODO proposal:
            // track.commit(transmutable.commits[i]);
            this.commit(new Commit(transmutable.commits[i]));
        }
    }
}


exports.State = State;
