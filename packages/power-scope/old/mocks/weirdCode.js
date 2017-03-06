"use strict";

// non existing variables:
a.b.c.d.e.f;
aa()().sss();
a;
aaa.ass.ffsa = aef;
s()()().ddd.pppa.aeoido.doid;
new 2;

// duplicated const assigments
const a = 2;
const a = 3;
a = 10;


function pp() {
    var a = new 3;

    // TODO line below can crash analysis. Uncomment and fix it.
    //bbb = {};
    // in visitor.js there is assigmnent like this:
    // state.lvalue.value = right.value;
    // and there is an error TypeError: Cannot set property 'value' of undefined

}
