const SE = require('.');
const write = SE.createDomOutput(document.body);
console.log("SSSSSS",write);
const { log, spy } = SE(SE.htmlLogger, write);

// TODO fix bug with infinite loop when logging spied objects (it doesn't detect circular references then):
// const someObject = spy({
//     foo: {
//         a: 2
//     },
//     bar: 3
// });

// first create some objects to log...

const pizza = {
    eat() {},
    bake() {},
    buy() {},
    name: "Super Pizza",
    id: 120,
    specification: {
        tomatos: true,
        strawberries: false,
        cheese: true,
        oregano: true,
    },
    price: 4.3,
    url: 'https://example.com/pizza/id=120',
};
pizza.specification.pizza = pizza;
const moon = {
    craters: {
        amount: 'many',
    },
    'ss kotek': '2',
    water: null,
};

// then...

log('This is Pizza', pizza); // it's like console.log but outputs in different way (e.g. in HTML format)

log('This is Moon', moon);
console.log("TRACE!", new Error('tk'));
log("AAA", new Error('aasx'), Promise.resolve(111));
// create spy
const proxied = spy({
    fact(n) {
        if (n == 1) return n;
        return n * this.fact(n - 1);
    }
});

proxied.fact(7);

log("start", new Date);
const p = spy(new Promise(resolve => {
    setTimeout(() => {
        log("end", new Date+'');
        resolve(123);
    }, 400)
}));

p.then((v) => {
    //log("AAA", v)
    return 'hej';
}).then((v) => {
    //log("", v)
})
//
// const SanEscobar = require('.');
// class Abc {
//     fact(n) {
//         if (n == 1) return n;
//         return n * this.fact(n - 1);
//     }
// }
// const se = SanEscobar(SanEscobar.htmlLogger);
//
// const cycle ={a:1, s:{}};
// cycle.s.a =cycle;
// const Proxied = se.spy(Abc);
//
// const proxied = new Proxied;
//
// proxied.result = proxied.fact(7);
// proxied.result ={d:{dd:3}}
// proxied.result++;
//
// proxied.fact(10, [{aa:2}], "ssss", true);
// const el = se.spy(require('snabbdom/h').default)('div');
// const toHtml = se.spy(require('snabbdom-to-html/init')([
//
// ]));
// toHtml(el);
//
// console.log(process.argv);
//
//
// se.log('procesik', true, false, 'aa1');
//
//c
//SE.htmlLogger.emit('info',{messages:[process]});
var stackTrace = require('stack-trace');
var err = new Error('something went wrong');
var trace = stackTrace.parse(err);
console.log("XXXX",trace);
log(trace);
