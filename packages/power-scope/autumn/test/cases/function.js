'use strict';

function w(data, handler) {
    handler(data);
}


module.exports = {
    desc: 'functions',
    mock: 'function',
    verify(t, analysis, scope) {
        t.equal(scope.vars.length, 4);
        w(scope.vars[0], var_ => {

        });
        w(scope.vars.find(v=>v.name == 'arrow').value, funcModel => {
            t.equal(funcModel.type, 'function')
            t.equal(funcModel.ret.length, 2);
            w(funcModel.ret[0], val => {
                t.equal(val.props.a.name, 'a');
            });
            w(funcModel.ret[1], val => {
                t.equal(val.props.b.name, 'b');
            });

        });

        w(scope.vars.find(v=>v.name == 'someFunction').value, funcModel => {
            t.ok(funcModel.ownScope);
        });
        //t.ok(scope.vars[2].value.props.foo)

        t.end();
    }
};
