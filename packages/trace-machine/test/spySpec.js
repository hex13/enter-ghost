"use strict";

const assert = require('assert');
const createSpy = require('../spy');


// factories which provide brand new objects for tests (to ensure we have fresh state on beginning of each test)

const functionFactory = () => function sum(a, b) { return a + b;};

const objectFactory = () => ({
    getExampleProperty: function () { return this.code; },
    code: 'cat',
    a: 1234, sum: functionFactory(),
});

const classFactory = () => class C {
    constructor(a, b, {c}) {
        this.code = 'cat';
        this.a = a + b + c;
    }
    getExampleProperty() {
        return this.code;
    }
    sum(a, b) {
        return a + b;
    }
};


const behaviorSpy = createSpy({
    logger: {
        emit() {}
    }
});

const events = [];
function reset () {
    events.length = 0;
};
const logSpy = createSpy({
    logger: {
        emit(type, payload) {
            //console.log("!!!",type, payload)
            events.push({
                type,
                payload
            })
        }
    }
});


function getProperty(create, spy) {
    const original = create();
    const proxy = spy(original);
    assert.equal(proxy.a, 1234);
};

function setProperty(create, spy) {
    const original = create();
    const proxy = spy(original);
    proxy.a = 123;
    assert.equal(original.a, 123)
};

function callFunction(create, spy) {
    const original = create();
    const proxy = spy(original);
    const result = proxy(10, 20);
    assert.equal(result, 30)
};

function newObject(create, spy) {
    let acc;

    const original = create();
    const ProxyClass = spy(original);

    const proxied = new ProxyClass(100, 20, {c: 3}); // new

    acc = proxied.a; // get
    assert.equal(acc, 123);

    proxied.a = acc + 1; // set
    acc = proxied.a; // get
    assert.equal(acc, 124);
};

function callMethod(create, spy) {
    const obj = create();
    const proxied = spy(obj);

    const code = proxied.getExampleProperty();
    assert.equal(code, 'cat');
}

describe('Spy', () => {
    it('getProperty', () => {
        reset();
        getProperty(objectFactory, logSpy);

        assert.equal(events.length, 1);
        assert.deepEqual(events[0], {
            type: 'get',
            payload: {
                name: 'a',
                value: 1234
            }
        });
    });

    it('setProperty', () => {
        reset();
        setProperty(objectFactory, logSpy);

        assert.equal(events.length, 1);
        assert.deepEqual(events[0], {
            type: 'set',
            payload: {
                name: 'a',
                value: 123
            }
        });
    });

    it('callFunction', () => {
        reset();
        callFunction(functionFactory, logSpy);

        assert.equal(events.length, 2);
        assert.equal(events[0].type, 'call');
        assert.equal(events[1].type, 'ret');
        assert.equal(events[1].payload.value, 30);
    });


    it('callMethod', () => {
        reset();

        callMethod(objectFactory, logSpy)

        // there is a question regarding specification.

        // now when accessed property is a function there is no get event:
        assert.equal(events.length, 3);
        assert.equal(events[0].type, 'call');
        assert.equal(events[1].type, 'get');
        assert.equal(events[2].type, 'ret');

        // but if it was this specification would be correct
        // assert.equal(events.length, 4);
        // assert.equal(events[0].type, 'get');
        // assert.equal(events[1].type, 'call');
        // assert.equal(events[2].type, 'get');
        // assert.equal(events[3].type, 'ret');
    });

    it('newObject', () => {
        reset();
        newObject(classFactory, logSpy);
        assert.equal(events.length, 4);
        assert.equal(events[0].type, 'new');
        assert.equal(events[1].type, 'get');
        assert.equal(events[2].type, 'set');
        assert.equal(events[3].type, 'get');
    });

    it('without context', () => {
        reset();
        const proxied = logSpy({
            foo() {
                if (!this) return 12345;
            }
        });
        const f = proxied.foo;
        assert.equal(f(), 12345)
    });

    it('promise', () => {
        reset();
        const proxied = logSpy(Promise.resolve(24));
        return proxied.then((v) => {
            assert.equal(v, 24);
        })
    });

});
