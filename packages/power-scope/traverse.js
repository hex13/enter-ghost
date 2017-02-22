"use strict";
const estraverse = require('estraverse');
const babylon = require('babylon');

const visitor = require('./visitor');
const commentVisitor = require('./commentVisitor');
const referenceGatherer = require('./referenceGatherer');

let visitors = [visitor, commentVisitor];

let visitorsData = new WeakMap;
visitors.forEach(visitor => {
    visitorsData.set(visitor, new WeakMap);
})

const assert = require('assert');
// const assert = function () {};
// assert.equal = function () {};

//-----------------------------------------------------------------------------
// helpers
//-----------------------------------------------------------------------------
const isScope = (node) => {
    return node.type.indexOf('Program') == 0 ||
        //node.type.indexOf('Function') == 0 ||
        node.type.indexOf('BlockStatement') == 0;
};


//-----------------------------------------------------------------------------
const createState = require('./state');
let state;




function invokeVisitor(visitor, node, type, phase) {
    const visitedWithDefault = visitorsData.get(visitor);
    if (type == 'default') {
        const flag = phase == 'enter'? 1 : 2;
        const bitmap = ~~visitedWithDefault.get(node);
        if (bitmap & flag) {
            return;
        }
        visitedWithDefault.set(node, bitmap | flag);
    }

    let handled = false;
    if (visitor.hasOwnProperty(type) && visitor[type]) {
        const visit = visitor[type];
        if (visit[phase]) {
            //try {
                visit[phase]({node}, state);
            // } catch (e) {
            //     console.error("Couldn't analyze: ", e);
            // }
            handled = true;
        }
    }
    if (!handled) {
        invokeVisitor(visitor, node, 'default', phase);
    }
}

function prepareState(node,  parent) {
    state.parent = parent;
    const path = this.__current.path;
    state.key = '';
    if (path instanceof Array) {
        state.key = path[path.length - 1];
    } else {
        state.key = path;
    }
};

function enterOrLeave(phase, node, parent) {
    prepareState.call(this, node, parent);

    visitors.forEach(visitor => {
        invokeVisitor(visitor, node, node.type, phase);
        if (isScope(node)) {
            invokeVisitor(visitor, node, 'Scope', phase);
        }
        if (node.type.indexOf('Function') == 0) {
            invokeVisitor(visitor, node, 'Function', phase);
        }
        if (node.type.indexOf('CallExpression') == 0 || node.type.indexOf('MemberExpression') == 0) {
            invokeVisitor(visitor, node, 'ChainLink', phase);
        }

    })
}

const mainVisitor = {
    enter(node, parent) {
        enterOrLeave.call(this, 'enter', node, parent);
    },
    leave(node, parent) {
        enterOrLeave.call(this, 'exit', node, parent);
    },
    // read: https://github.com/estools/estraverse/issues/32
    fallback: 'iteration',
    keys: {
    }
};


function checkInvariants(state) {
    assert.equal(
        state.expr.length, 1,
        `state.expr array should contain exactly one item before and after traversing. It contains ${state.expr.length} items.`);
    assert.equal(
        state.chains.length, 0,
        `state.chains array should not contain items before and after traversing. It contains ${state.chains.length} items.`);

}

function analyzeFile(file) {



    return file.read().then(contents => {
        state = createState();
        checkInvariants(state);
        const ast = babylon.parse(contents, {
             sourceType: "module",
             ecmaVersion: 6,
             plugins: [
             ]
        });
        state.result.path = file.path;
        estraverse.traverse(ast.program, mainVisitor);
        checkInvariants(state);
        let lastVisitors = visitors;
        visitors = [referenceGatherer];

        visitors.forEach(visitor => {
            visitorsData.set(visitor, new WeakMap);
        });
        estraverse.traverse(ast.program, mainVisitor);
        visitors = lastVisitors;




        return state.result;
    });

}

module.exports = function (files, resolve, vfs) {
    const fileQueue = files.slice(0);
// HERE asynchronous recursion
    function iterate(md) {
        const file = fileQueue.shift();
        if (file) {
            return analyzeFile(file).then(result => {
                result.requires.forEach(relativePath => {
                    fileQueue.push(vfs.open(resolve(file.path, relativePath)));
                })
                md.files.push(result)
                if (files.length)
                    return iterate(md)
            });
        } else {
            return Promise.resolve(md);
        }
    }
    return iterate({files: []});
    //
    // return file.read().then(code => {
    //     analyzeFile(code);
    //     return {files: [state.result]};
    // });
    // return file.read().then((code) => {
    //
    //
    //     while (file = fileQueue.shift()) {
    //
    //     }
    //
    //     function doWhile(it) {
    //         const obj = it();
    //
    //     }
    //
        // analyzeFile(file).then(result => {
        //
        // });

    //     return {
    //         files: [state.result]
    //     };
    // });

};
