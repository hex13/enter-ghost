"use strict";

const Commit = require('./commit');
const { AUTO } = require('transmutable/symbols');
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
            const desc = auto[k];
            if (typeof desc == 'function') {
                d[k] = desc(d);
            } else if(desc.isResource) {
                if (!d.resources)
                    d.resources = [];
                if (!d.resources.find(res => {
                    return res.id == desc.resource.id;
                }))
                    d.resources.push(desc.resource);
            } else {
                if (desc.arr) d[k] = desc.arr[desc.idx % desc.arr.length];
            }

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



        this.commits.push(commit);

        this.assignAutoValues();

        this.hooks.onCommit && this.hooks.onCommit(this, commit);
        this.state$.publish(this.target, prevTarget);
        return this.target;
    }
    observe(handler) {
        if (handler)
            return this.state$.select(d => d).subscribe(handler);
    }
    select(selector) {
        return {
            run: (handler) => this.run(handler, selector),
            observe: (handler) => {
                return this.state$.select(selector).subscribe(handler);
            }
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
