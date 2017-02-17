"use strict";

function queryWithChain(structure, list) {
    let curr = structure;
    list.forEach(predicate => {
        switch (predicate.type) {
            case 'prop':
                curr = curr.value.props.get(predicate.name);
        }
    });
    return curr;
}


function parseQuery(queryString) {
    const re = /(\W) *([$\w]+)/gu;
    let match;
    const operators = {
        '.': 'prop'
    };
    const chain = [];
    while (match = re.exec(queryString)) {
        const [all, op, name] = match;

        if (operators.hasOwnProperty(op)) {

            chain.push({type: operators[op], name});
        } else {
            chain.push({type: op, name});
        }

    }
    return chain;
}

function queryWithString (structure, queryString) {
    return queryWithChain(structure, parseQuery(queryString));
};


module.exports = {
    queryWithChain,
    queryWithString,
    parseQuery,
}
