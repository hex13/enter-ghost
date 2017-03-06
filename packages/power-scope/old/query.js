"use strict";

function queryWithChain(structure, list, all={files:[]}, cb) {

    let curr = structure;
    function resolveCall(value) {
        if (value.name == 'require') {
            const module = all.files.find(
                f=>f.path == value.args[0]
            );
///            do {
                value = queryWithChain(module.scopes[0].vars.get('module'), [
                    {type: 'prop', name: 'exports'}
                ], all).value;

    //        } while (value.type == 'call')
        }
        return value;
    }

    function resolve(value) {
        if (value && value.type == 'call') {
            return resolveCall(value);
        }
        return value;
    }
    list.forEach(function visit(predicate) {
        if (curr == undefined) return;
        let value = 'value' in curr? curr.value : curr;

        value = resolve(value);
        if (value == undefined) return;
        switch (predicate.type) {
            case 'prop': {
                const props = value.props;
                if (props) {
                    curr = resolve(props.get(predicate.name));
                } else return
                break;
            }
            case 'var': {
                const vars = value.vars;
                if (vars == undefined) return;
                curr = resolve(vars.get(predicate.name));

                //cb && cb(curr);
            }
        }

    });

    if (curr != undefined)
        curr.value = resolve(curr && curr.value);
    return curr;
}


function parseQuery(queryString) {
    const q = queryString;
    queryString = queryString.replace(/\n/g, ' ');

    const indexOfSemicolon = queryString.indexOf(';');
    if (indexOfSemicolon > 0) {
        queryString = queryString.slice(0, indexOfSemicolon);
    }

    //const re = /(\W) *([$\w]+)/gu;
    const re = /([.@𝚿])? *([$\w]+) *(\(.*?\))?/gum;

    let match;
    const operators = {
        '.': 'prop',
        '@': 'var',
    };
    const chain = [];
    while (match = re.exec(queryString)) {

        let [all, op, name] = match;
        if (!op) op = '@';

        if (operators.hasOwnProperty(op)) {
            chain.push({type: operators[op], name});
        } else {
            chain.push({type: op, name});
        }

    }

    return chain;
}

function queryWithString (structure, queryString, all) {
    return queryWithChain(structure, parseQuery(queryString), all);
};


module.exports = {
    queryWithChain,
    queryWithString,
    parseQuery,
}
