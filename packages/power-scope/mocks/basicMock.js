"use strict";


const abc = {
    prop1: {
        deepProp: 1
    },
    prop2: 1
};

let def = 3;
function abc () {
    const ooo = {abc: {def: 1}, meth(arg) { arg;this.abc; this;        } };
    let aa;
    ooo;
    ooo.abc.def; ooo.meth();
}

if (true) {


}

function foo (arg1) {
    arg1;



}


for (let i = 0; i < 10; i++) {

}

const something = someFunction({not:2});

foo; foo();

let test;
const arrow1 = (test) => {
    test;
};

const arrow2 = function noVar (test) {
    test;
}

const o = {
    p: {
        r() {
            this;
        },
        s: {
            t() {
                this.t;
                const a = 2;
                if (this.t) {
                    this.t;
                    const a = 2;
                    if (a) {
                        a(() => {a; this.a;});
                    }
                    function s()  {
                        a;

                        //
                        this.t
                    };
                    (function s()  {
                        a;

                        //
                        this.t
                    })();

                }
            },
            u: function () {
                this;
            },
            v() {
                const a = {
                    b: () => { this; }
                };
            }
        }
    }
};
