"use strict";
const m = new WeakMap;
const visitor = {
    Program: {
        enter({node}, state) {
            state.result.comments = [];
        }
    },
    default: {
        enter({node}) {

        },
        exit({node}, state) {
            if (node.leadingComments) {
                node.leadingComments.forEach(cm => {
                    state.result.comments.push(cm.value);
                });
            }

        }
    }
};
module.exports = visitor;
