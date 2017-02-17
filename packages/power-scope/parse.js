"use strict";

const babylon = require('babylon');

module.exports = function parse(code) {
    return babylon.parse(code, {
         sourceType: "module",
         ecmaVersion: 8,
         plugins: [
             'flow'
         ]
    });
};
