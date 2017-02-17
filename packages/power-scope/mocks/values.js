const one = 1;
const two = 2;
let three = 3, four = 4;
var five = 5, six = 6;
let a = 1;

const obj = {
    a: 1,
    b: 2,
    sub: {
        aa: 10
    },
    c: 100,
};

const assignedObj = obj;

const twoFromObjProperty = obj.b;
const tenFromObjProperties = obj.sub.aa;
obj.c = 101;

//obj.b = 10;
function foo () {
    const seven = 7;
    const sevenAgain = seven;


    const fiveAgain = five;

    // handle assigning to variables from outer scopes
    //  (maybe ignore them because if something is in function
    // there is no guarantee that this code will be executed whatsoever
    // so we can't assume with 100% certainty that in real app `a` will be equal 2:
    //a = 2;
    // )
}


// ofc, we can't assume that `a` will be equal 23, but this code at least will execute when module will be loaded:
a = 23;

const str = 'Cat';

let str2;

str2 = 'Dog';

let obj2;
obj2 = {text: 'Turtle'};

if (true) {
    nonExistingObject.property = {
        text: 'Parrot'
    }
}
//obj2 = 123;
const bar = function () {

};

// TODO handle (maybe ignore) non existing variables
//f = 3;
