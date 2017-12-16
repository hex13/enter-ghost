"use strict";

const { set, get } = require('./get-set');
const createStage = require('./createStage');

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
}

function Transmutable(o) {
    this.events = [];
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

Transmutable.prototype.commit = function commit() {
    const copied = this.reify();
    this.target = copied;
    const called = [];

    this.lastCommit = new Commit(this.nextCommit.mutations, this.events);

    callObservers(this.lastCommit, this.observers);

    this.commits.push(this.lastCommit);

    this.events = [];
    this.nextCommit = new Commit();
    return copied;
}

Transmutable.prototype.reify = function reify(target) {
    const mutations = this.nextCommit.mutations;
    const copied = cloneDeepWithDirtyChecking(this.target, mutations);
    applyMutations(copied, mutations);
    return copied;
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

Transmutable.prototype.put = function put(event) {
    this.events.push(event);
}

exports.Transmutable = Transmutable;
exports.applyMutations = applyMutations;
exports.transform = (original, transformer) => {
    const t = new Transmutable(original);
    transformer(t.stage);
    return t.reify();
};

//exports.clone = cloneDeepWithDirtyChecking;
