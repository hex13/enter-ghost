'use strict';

const expect = require('chai').expect;
function w(data, handler) {
    handler(data);
}

module.exports = {
    desc: 'scope',
    mock: 'outline',
    verify(t, analysis, scope) {
        t.equal(scope.scopes.length, 2);

        w(scope.scopes[0], scope => {
            t.equal(scope.nodeType, 'FunctionDeclaration');

            w(scope.scopes[0], scope => {
                t.equal(scope.nodeType, 'BlockStatement');

                const binding = scope.vars[0];
                t.equal(binding.name, 'abc');
                t.equal(binding.value.type, 'function')
            });

        });
        t.end();
    }
};
