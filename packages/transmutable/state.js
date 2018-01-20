"use strict";

const Commit = require('./commit');
const { AUTO } = require('./symbols');
const { Stream } = require('./stream');

const errorChecks = {
    Transmutable: {
        commit(commit) {
            if (!commit || !commit.isCommit) throw new Error('Wrong argument passed to method Transmutable::commit()')
        }
    }
}

function assignAutoValues(d) {
    const auto = d[AUTO];
    if (auto) {
        for (let k in auto) {
            d[k] = auto[k](d);
        }
    }
}


class State {
    constructor(o, hooks = {}) {
        this.state$ = Stream();
        this.target = o;
        this.commits = [];
        this.hooks = hooks;

        this.assignAutoValues();
    }
    assignAutoValues() {
        this.target = new Commit(assignAutoValues).run(this.target);
    }
    get() {
        return this.target;
    }
    run(handler, selector) {
        return this.commit(new Commit(handler, selector));
    }
    commit(commit) {
        errorChecks.Transmutable.commit(commit);

        const prevTarget = this.target;
        this.target = commit.run(this.target);

        this.state$.publish(this.target, prevTarget);

        this.commits.push(commit);

        this.assignAutoValues();

        this.hooks.onCommit && this.hooks.onCommit(this, commit);
        return this.target;
    }
    observe(...args) {
        const handler = typeof args[0] == 'function'? args[0] : args[1];
        const path = typeof args[0] == 'function'? null : args[0];
        return this.state$.select(path).subscribe(handler);
    }
    select(selector) {
        return {
            run: (handler) => this.run(handler, selector)
        }
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
            this.commit(transmutable.commits[i]);
        }
    }
}


exports.State = State;
