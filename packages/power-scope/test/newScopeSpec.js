"use strict";

const scope = require('../traverse');
const assert = require('assert');
const Path = require('path');


const inspect = (n,o) => console.log(n,require('util').inspect(o, {colors: true, depth:16}));

const SKIP = Symbol();
const ONLY = Symbol();

// mock of module resolver
function resolve(from, path) {
    return from + ':' + path;
}

// mock of virtual file system
const vfs = {
    open(path) {
        return {
            path,
            read() {
                return Promise.resolve(`module.exports = {text: '${path}'}`);
            }
        }
    }
};


// helpers, they should be eventually merged with project itself
const getModuleExports = (fileStructure) => {
    return fileStructure.scopes[0].vars.get('module').value.props.get('exports').value;
};


function evaluate(fileStructure, all, value) {
    const path = fileStructure.path;
    if (value.type == 'call') {
        if (value.name == 'require') {
            const relPath = value.args[0];
            const absPath = resolve(path, relPath);
            const imported = getModuleExports(all.files.find(f => f.path == absPath));
            return imported;
        }
    }
}

//----

const files = [
    [__dirname + '/../simple.js', (result) => {
        const scopes = result.scopes;
        assert.equal(scopes.length, 2);
        const objVar = scopes[0].vars.get('obj');
        assert(objVar);

        // value is not a variable! value can have props, variable can have value
        const aProp = objVar.value.props.get('a');
        assert(aProp);

        const bProp = aProp.value.props.get('b');

        assert(bProp);
        assert.equal(bProp.value, 2);
    }],
    [__dirname + '/../mocks/objects.js', (result) => {
        assert.equal(result.scopes.length, 1);

        let objVar, objValue;

        objVar = result.scopes[0].vars.get('obiekcik');
        assert.equal(objVar.name, 'obiekcik');

        objValue = objVar.value;
        assert.equal(Array.from(objValue.props).length, 2);

        assert(objValue.props.get('abcd'));
        //assert(objValue.props.get('abc').props.get('def').props.get('ghi'));
        assert(objValue.props.get('abc').value.props.get('def').value.props.get('ghi'));
    }],
    [__dirname + '/../mocks/functions.js', (result) => {

    }],
    [__dirname + '/../mocks/scopesAndVars.js', (result) => {
        //assert.equal(result.scopes.length, 3);

        //inspect('OXXXX', result.scopes[0]);
        assert(result.scopes[0].vars.get('zoo'));

        const someFunction = result.scopes[0].vars.get('someFunction').value;

        assert(someFunction);
        assert.equal(someFunction.vars.size, 3);
        assert(someFunction.vars.get('abc'));
        assert(someFunction.vars.get('abcd'));
        assert(someFunction.vars.get('hoisted'));
        assert.equal(someFunction.vars.get('def'), undefined);
        assert.equal(someFunction.scopes.length, 1);
        assert.equal(someFunction.scopes[0].vars.size, 1);
        assert(someFunction.scopes[0].vars.get('def'));
    }],
    [__dirname + '/../mocks/values.js', (result) => {
        assert.equal(result.scopes[0].vars.get('one').value, 1);
        assert.equal(result.scopes[0].vars.get('two').value, 2);
        assert.equal(result.scopes[0].vars.get('twoFromObjProperty').value, 2);
        assert.equal(result.scopes[0].vars.get('tenFromObjProperties').value, 10);


        assert.equal(result.scopes[0].vars.get('three').value, 3);
        assert.equal(result.scopes[0].vars.get('four').value, 4);
        assert.equal(result.scopes[0].vars.get('five').value, 5);
        assert.equal(result.scopes[0].vars.get('six').value, 6);

        assert.equal(
            result.scopes[0].vars.get('assignedObj').value,
            result.scopes[0].vars.get('obj').value
        );

        assert.equal(result.scopes[0].vars.get('obj').value.props.get('c').value, 101)

        assert.equal(result.scopes[0].vars.get('foo').value.vars.get('seven').value, 7);
        assert.equal(result.scopes[0].vars.get('foo').value.vars.get('sevenAgain').value, 7);
        assert.equal(result.scopes[0].vars.get('foo').value.vars.get('fiveAgain').value, 5);

        assert.equal(result.scopes[0].vars.get('a').value, 23);

        assert.equal(result.scopes[0].vars.get('str').value, 'Cat');
        assert.equal(result.scopes[0].vars.get('str2').value, 'Dog');

        assert.equal(result.scopes[0].vars.get('bar').value.type, 'function');

        assert.equal(result.scopes[0].vars.get('obj2').value.props.get('text').value, 'Turtle');
        assert.equal(result.scopes[0].vars.get('nonExistingObject').value.props.get('property').value.props.get('text').value, 'Parrot');
        //assert.equal(result.scopes[0].vars.get('obj2').value, 'Turtle');
    }],
    [__dirname + '/../mocks/values-advanced.js', (result) => {
        // given
        // const someVariable = require('someModule')
        // should not think that someVariable == 'someModule'
        // in AST this looks like this:
        //
        // * someVariable =             // VariableDeclarator
        //      * require(              // CallExpression
        //          * 'someModule'      // StringLiteral
        //      )
        assert(result.scopes[0].vars.get('someVariable').value != 'someModule');
        const requireCall = result.scopes[0].vars.get('someVariable').value;
        assert.equal(requireCall.type, 'call');
        assert.equal(requireCall.name, 'require');
        assert.deepEqual(requireCall.args, ['someModule']);

    }],

    [__dirname + '/../mocks/comments.js', (result) => {
        assert.equal(result.comments.length, 1);
        assert.equal(result.comments[0], ' to jest komentarz');

    }],
    [__dirname + '/../mocks/requires.js', (result, all, path) => {
        assert.equal(result.requires.length, 5);
        assert.strictEqual(result.requires[0], 'react');
        assert.strictEqual(result.requires[1], 'fs');
        assert.strictEqual(result.requires[2], './whatever.js');
        assert.strictEqual(result.requires[3], '.');
        assert.strictEqual(result.requires[4], 'turtle');
        assert.equal(all.files.length, 6);
        assert.equal(all.files[0].path, path);

        assert.equal(all.files[5].path, resolve(path, 'turtle'));

        //const turtle = all.files[5];
        //assert.equal(getModuleExports(turtle), 2)


        assert.equal(getModuleExports(all.files[1]).props.get('text').value, path + ':react');
        assert.equal(getModuleExports(all.files[2]).props.get('text').value, path + ':fs');
        assert.equal(getModuleExports(all.files[3]).props.get('text').value, path + ':./whatever.js');

        const evaluated = evaluate(result, all, result.scopes[0].vars.get('Turtle').value);
        assert.equal(evaluated.props.get('text').value, path + ':turtle');

    }],
    [__dirname + '/../mocks/imports.js', (result) => {
        assert.equal(result.imports.length, 2);
        assert.strictEqual(result.imports[0], 'abc');
        assert.strictEqual(result.imports[1], './def');
    }],
    [__dirname + '/../mocks/module-exports.js', (result, all) => {
        assert.equal(all.files[0].scopes[0].vars.get('module').value.props.get('exports').value, 'There many kinds of turtles.');
    }],
    [__dirname + '/../mocks/project/index.js', (result, all) => {
        //assert.equal(all.files[1].scopes[0].vars.get(''), 2);
    }],
    [__dirname + '/../mocks/classes.js', (result, all) => {
        const Abc = result.scopes[0].vars.get('Abc');
        assert.equal(Abc.value.type, 'class');
        assert.equal(Abc.name, 'Abc');
    }],
    [__dirname + '/../mocks/loc.js', (result, all) => {
        let loc;

        loc = result.scopes[0].loc;
        assert.equal(loc.start.line, 1);
        assert.equal(loc.start.column, 0);

        loc = result.scopes[1].loc;
        assert.deepEqual(loc, {
            start: {
                line: 2, column: 10
            },
            end: {
                line: 6, column: 1
            }
        });

        loc = result.scopes[2].loc;
        assert.deepEqual(loc, {
            start: {
                line: 3, column: 20
            },
            end: {
                line: 5, column: 5
            }
        });

        loc = result.scopes[0].vars.get('obj').loc;
        assert.deepEqual(loc, {
            start: {
                line: 13, column: 6
            },
            end: {
                line: 13, column: 9
            }
        })

        loc = result.scopes[0].vars.get('obj').value.props.get('prop1').loc;

        assert.deepEqual(loc, {
            start: {
                line: 14, column: 4
            },
            end: {
                line: 14, column: 9
            }
        })

        let ref;
        ref = result.scopes[0].vars.get('obj').refs[0];
        assert.deepEqual(ref.loc, {
            start: {
                line: 23,
                column: 2
            },
            end: {
                line: 23,
                column: 5,
            }
        });

        let binding;
        binding = result.scopes[0].vars.get('obj');
        ref = binding.refs[1];

        assert.deepEqual(ref.loc, {
            start: {
                line: 25,
                column: 5
            },
            end: {
                line: 25,
                column: 8,
            }
        });

        let entity
        entity = result.entityAt({
                line: 25,
                column: 5
        });
        assert.strictEqual(entity, binding);


        const scope = result.scopes[0];

        let refLoc = {
            start: {
                line: 26,
                column: 6
            },
            end: {
                line: 26,
                column: 8
            }
        };
        assert.deepEqual(scope.chains[1][1].loc, refLoc);

        assert.deepEqual(scope.vars.get('obj').value.props.get('aa').loc, {
            start: {
                line: 16,
                column: 4
            },
            end: {
                line: 16,
                column: 6
            }
        });
        assert.deepEqual(scope.vars.get('obj').value.props.get('aa').refs[0].loc, refLoc);

        entity = result.entityAt({
                line: 26,
                column: 6
        });

        assert.strictEqual(entity,  scope.vars.get('obj').value.props.get('aa'));


        assert.deepEqual(scope.chains[2][0].loc, {
            start: {
                line: 28,
                column: 0
            },
            end: {
                line: 28,
                column: 3
            }
        });
        scope.chains.forEach(ch => {
            const link = ch[0];
            ch.forEach(link => {
                assert(link.loc, JSON.stringify(link));
            })
            assert(link.loc);
        });

        //variable.refs

        let prop;
        prop = result.scopes[0].vars.get('obj').value.props.get('prop1');
        assert.equal(prop.refs.length, 1);
        assert.deepEqual(prop.refs[0].loc, {
            start: {
                line: 33,
                column: 4
            },
            end: {
                line: 33,
                column: 9
            }
        });
    }],
    [__dirname + '/../mocks/chains.js', (result, all) => {
        const scope = result.scopes[0];



        let chain;
        assert.equal(scope.chains.length, 6);


        chain = scope.chains[0];

        assert.equal(chain.length, 5);

        assert.equal(chain[0].name, 'a');
        assert.equal(chain[0].type, 'var');

        assert.equal(chain[1].name, 'b');
        assert.equal(chain[1].type, 'prop');

        assert.equal(chain[2].name, 'c');
        assert.equal(chain[2].type, 'prop');

        assert.equal(chain[3].name, 'd');
        assert.equal(chain[3].type, 'prop');

        assert.equal(chain[4].name, 'e');
        assert.equal(chain[4].type, 'prop');

        chain = scope.chains[1];

        assert.equal(chain.length, 2);


        assert.equal(chain[0].name, 'foo');
        assert.equal(chain[0].type, 'var');

        assert.equal(chain[1].name, 'bar');
        assert.equal(chain[1].type, 'call');
        assert.equal(chain[1].access, 'prop');

        chain = scope.chains[2];

        assert.equal(chain.length, 3);

        assert.equal(chain[0].name, 'a');
        assert.equal(chain[0].type, 'var');

        assert.equal(chain[1].name, 'b');
        assert.equal(chain[1].type, 'prop');

        assert.equal(chain[2].name, 'c');
        assert.equal(chain[2].type, 'prop');

        chain = scope.chains[3];
        assert.equal(chain.length, 3);

        //
        assert.equal(chain[0].name, 'az');
        assert.equal(chain[0].type, 'call');
        assert.equal(chain[0].access, 'var');
        //
        assert.equal(chain[1].name, 'bz');
        assert.equal(chain[1].type, 'prop');
        //
        assert.equal(chain[2].name, 'cz');
        assert.equal(chain[2].type, 'prop');
        //
        chain = scope.chains[4];
        //
        assert.equal(chain.length, 3);

        assert.equal(chain[0].name, 'ay');
        assert.equal(chain[0].type, 'var');

        //
        assert.equal(chain[1].name, 'by');
        assert.equal(chain[1].type, 'call');
        assert.equal(chain[1].access, 'prop');
        //
        assert.equal(chain[2].name, 'cy');
        assert.equal(chain[2].type, 'prop');

        chain = scope.chains[5];
        assert.equal(chain.length, 1);

        assert.equal(chain[0].name, 'cosTam');
        assert.equal(chain[0].type, 'call');

        //

         // assert.equal(chain, 3);
        //
        //
        //


        // assert.equal(Abc.name, 'Abc');
    }],
    [__dirname + '/../mocks/references.js', (result, all) => {
        const variable = result.scopes[0].vars.get('o');
        console.log("BLBLLW")
        inspect(result.scopes[0].chains);

        assert.equal(variable.refs.length, 5);

        // assert.equal(Abc.name, 'Abc');
    }],
    [__dirname + '/../mocks/weirdCode.js', (result, all) => {
        assert.equal(result.scopes.length, 2, 'It should not crash when code is weird.');
        //asert.equal(result.scopes[0].vars.get('a').value.props.get('b'))
        // const variable = result.scopes[0].vars.get('o');
        //  assert.equal(variable.references.length, 3);
        // assert.equal(Abc.name, 'Abc');
    }],


];

describe('scope', () => {

    files.forEach(([path, verify, skip]) => {

        const fileName = Path.relative(__dirname, path);
        let _it = it;
        if (skip === SKIP) _it = xit;
        if (skip === ONLY) _it = it.only;
        _it(`should analyze scope in '${fileName}'`, () => {
            const code = require('fs').readFileSync(path, 'utf8');
            const file = {
                read() {
                    return Promise.resolve(code);
                },
                path
            };

            return scope([
                file,
            ], resolve, vfs).then(result => {
                assert.equal(result.files[0].path, path);
                return verify(result.files[0], result, path);

                //assert(result.files[1]);
                //assert.equal(result.files[1].scopes[0].vars.get('a').value, 1);
            });
        });
    })


    // it('should parse objects', () => {
    //     const code = require('fs').readFileSync(files.shift(), 'utf8');
    //     const result = scope(code);
    //     console.log('\n\n',require('util').inspect(result, {colors:true,depth:16}));
    //     assert.equal(result, 1)
    // });
});