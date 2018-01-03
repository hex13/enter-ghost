"use strict";

const { set, get } = require('./get-set');
const createStage = require('./createStage');
const { cloneAndApplyMutations } = require('./cloning');
const Commit = require('./commit');

const errorChecks = {
    Transmutable: {
        commit(commit) {
            if (!(commit instanceof Commit)) throw new Error('Wrong argument passed to method Transmutable::commit()')
        }
    }
}

function Transmutable(o, hooks = {}) {
    this.target = o;
    this.observers = [];
    this.commits = [];
    this.hooks = hooks;
    this.lastCommit = new Commit();
    this.nextCommit = new Commit();

    this.stage = createStage(() => this.target, {
        set: (path, v) => {
            this.nextCommit.mutations.push([path, v]);
        }
    });
}

// TODO
function applyCommit(commit, target) {

}


function callObservers(observers, lastState, nextState) {
    observers.forEach(({path, handler}) => {
        if (
            path ?
            get(lastState, path) !== get(nextState, path) :
            lastState !== nextState
        ) handler(path? get(nextState, path) : nextState);
    });
}

// TODO think about:
// 1. when running action: to fork or not to fork?
// 2.runAction vs. commit? (do we need 2 functions or just one?)
// 3. naming: runAction? run? dispatch? etc.

Transmutable.prototype.unstable_runAction = function (handler) {
    const commit = new Commit();
    const stage = createStage(() => this.target, {
        set: (path, v) => {
            commit.mutations.push([path, v]);
        }
    });
    handler(stage);
    return this.commit(commit);
}

Transmutable.prototype.commit = function commit(commit = this.nextCommit) {
    errorChecks.Transmutable.commit(commit);

    const prevTarget = this.target;
    this.target = cloneAndApplyMutations(this.target, commit.mutations);

    callObservers(this.observers, prevTarget, this.target);

    this.commits.push(commit);
    this.lastCommit = commit;
    this.nextCommit = new Commit();
    this.hooks.onCommit && this.hooks.onCommit(this, commit);
    return this.target;
}


Transmutable.prototype.reify = function reify(target) {
    return cloneAndApplyMutations(this.target, this.nextCommit.mutations);
};

Transmutable.prototype.select = function (path) {
    return {
        subscribe: (handler) => {
            this.observers.push({
                path,
                handler
            });
        }
    }
}

Transmutable.prototype.observe = function observe(...args) {
    const handler = typeof args[0] == 'function'? args[0] : args[1];
    const path = typeof args[0] == 'function'? null : args[0];
    this.select(path).subscribe(handler);
}

Transmutable.prototype.fork = function fork() {
    const t = new Transmutable(this.target);
    t.commits = this.commits.slice();
    return t;
}

Transmutable.prototype.merge = function merge(transmutable) {
    // TODO proposal:
    // const track = new Track();
    for (let i = 0; i < transmutable.commits.length; i++) {
        this.nextCommit.mutations = transmutable.commits[i].mutations;
        if (this.commits.includes(transmutable.commits[i])) continue;
        // TODO proposal:
        // track.commit(transmutable.commits[i]);
        this.commit();
    }
}


exports.Transmutable = Transmutable;

exports.transform = require('./transform');
