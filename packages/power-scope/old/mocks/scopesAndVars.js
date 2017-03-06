const zoo = {
    tiger: true
};

function someFunction() {
    var abc = 1, abcd = 2;
    if (true) {
        var hoisted = 2;
        const def = 2;
    }

}

function otherFunction () {
    var zzz = 2;
    var xxxd = 3;
}

someFunction();
