"use strict";

const { set, get } = require('./get-set');
const createStage = require('./createStage');

const errorChecks = {
    Transmutable: {
        commit(commit) {
            if (!(commit instanceof Commit)) throw new Error('Wrong argument passed to method Transmutable::commit()')
        }
    }
}

function isDirty(mutations, propPath, target) {
    for (let i = 0; i < mutations.length; i++) {
        const mutPath = mutations[i][0];
        const mutValue = mutations[i][1];
        const minLen = Math.min(mutPath.length, propPath.length);
        let affectedByMutation = true;
        for (let j = 0; j < minLen; j++) {
            const mutPropName = mutPath[j];
            const searchedPropName = propPath[j];
            if (mutPropName !== searchedPropName) {
                affectedByMutation = false;
                break;
            }
        }
        if (affectedByMutation) {
            if (get(target, mutPath) !== mutValue) return true;
        }

    }
    return false;
}

function cloneDeepWithDirtyChecking(o, mutations) {

    const copy = (o, objPath = []) => {
        if (!isDirty(mutations, objPath, o)) return o;
        let o2;
        if (Array.isArray(o)) {
            o2 = o.slice();
        } else o2 = {};

        // NOTE currently we're doing for...in also for arrays (is this correct?)

        for (let k in o) {
            if (o[k] && typeof o[k] =='object') {
                const propPath = new Array(objPath.length + 1);
                for (let i = 0; i < objPath.length; i++) {
                    propPath[i] = objPath[i];
                }
                propPath[objPath.length] = k;

                o2[k] = copy(o[k], propPath);
            } else {
                o2[k] = o[k];
            }
        }
        return o2;
    }
    return copy(o);
}

function Commit(mutations = [], events = []) {
    this.mutations = mutations;
    this.events = events;
    this.put = (event) => {
        this.events.push(event);
    };
}

function Transmutable(o) {
    this.target = o;
    this.observers = [];
    this.commits = [];
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


function applyMutations(target, mutations) {
    for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];;
        if (!m) break;
        const [path, value] = m;
        set(target, path, value);
    }
};

function containsPath(a, b) {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

function callObservers(commit, observers) {
    observers.forEach(observer => {
        if (observer.path) {
            for (let i = 0; i < commit.mutations.length; i++) {
                const [mutPath, mutValue] = commit.mutations[i];
                if (containsPath(mutPath, observer.path)) {
                    observer.handler();
                    return; // to ensure that given observer will be called no more than once
                }
            }
        } else {
            observer.handler();
        }
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

    this.target = cloneAndApplyMutations(this.target, commit.mutations);

    callObservers(commit, this.observers);

    this.commits.push(commit);
    this.lastCommit = commit;
    this.nextCommit = new Commit();

    return this.target;
}

function cloneAndApplyMutations(sourceObject, mutations) {
    const nextValue = cloneDeepWithDirtyChecking(sourceObject, mutations);
    applyMutations(nextValue, mutations);
    return nextValue;
}

Transmutable.prototype.reify = function reify(target) {
    return cloneAndApplyMutations(this.target, this.nextCommit.mutations);
};

Transmutable.prototype.observe = function observe(...args) {
    const handler = typeof args[0] == 'function'? args[0] : args[1];
    const path = typeof args[0] == 'function'? null : args[0];
    this.observers.push({
        path,
        handler
    });
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
exports.applyMutations = applyMutations;

exports.transform = (original, transformer) => {
    const mutations = [];
    const stage = createStage(() => original, {
        set: (path, v) => {
            mutations.push([path, v]);
        }
    });
    transformer(stage);
    return cloneAndApplyMutations(original, mutations);
};

//exports.clone = cloneDeepWithDirtyChecking;
