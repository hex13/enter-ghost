'use strict';

class Matcher {
    constructor(isMatch) {
        this.patterns = [];
        this.isMatch = isMatch;
    }
    add(params) {
        this.patterns.push(params);
    }
    match(pattern) {
        // for (let i = 0; i < this.patterns.length; i++) {
        //     const storedPattern = this.patterns[i];
        //     const res = this.isMatch(pattern, storedPattern);
        //     if (res) {
        //         return res;
        //     }
        // }
        return this.patterns.find(storedPattern => this.isMatch(pattern, storedPattern));
    }
    matchAll(pattern) {
        return this.patterns.filter(storedPattern => this.isMatch(pattern, storedPattern));
    }
}

exports.Matcher = Matcher;