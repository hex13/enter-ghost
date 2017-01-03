//const abc = require('./abc');
let counter = 0;
const fact = (n) => {
    if (n == 1) return n;
    return n * fact(n - 1);
};


class Dog {
    say() {
        console.log("Hau, hau " + Math.random());
    }
}
var dog = new Dog;

dog.say();
function Cat() {
    this.animal = 'cat';
    console.log(`cat number ${++counter} created`);
}
Cat.prototype.say = function (silent) {
    if (silent) return "meow"; else console.log("meow");
};

Cat.prototype.hi = function(name) {
    console.log(`Hi, ${ name }! ${ this.say(true)} `)
};
const cat = new Cat;
cat.say();
cat.hi('Tom');
function log(s) {
    console.log(s);
}

log(`This is result: ${fact(7)}`);
