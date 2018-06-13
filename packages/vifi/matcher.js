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
        return this.patterns.find(storedPattern => this.isMatch(pattern, storedPattern));
    }
    matchAll(pattern) {
        return this.patterns.filter(storedPattern => this.isMatch(pattern, storedPattern));
    }
}

exports.Matcher = Matcher;