const snabbdom = require('snabbdom');

//TODO check: https://github.com/snabbdom/snabbdom/issues/199
const h = require('snabbdom/h')//.default;

const { createCodeMirror, openDoc } = require('enter-ghost-codemirror');

window.logged = '';

const log = (s) => {
    window.logged += s;
};

const components = {
    appTopBar: (doc) => {
        const tabs = doc.docs.map(tab => {
            const tabStyle = {
                flexShrink: 1,
                overflow: 'hidden',
                boxShadow: '2px 2px 3px rgba(0, 0, 0, 0.3)',
                padding: '2px',
                color: '#999',
                background: 'linear-gradient(to bottom, #444, #333)',
                margin: '0 2px',
                whiteSpace: 'nowrap',
                cursor: 'default',
                //border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '4px',
                textShadow: '1px 1px rgba(0, 0, 0, 0.2)',
            };
            const tabEvents = {
                click(e, vnode) {

                    log('activate@${tab.id}');
                }
            };
            return h('div', {style: tabStyle, on: tabEvents},  tab.file.basename());
        });
        const style = {
            display: 'flex',
            width: '100%',
            padding: '4px',
        };
        return h('div', {style}, tabs)
    }
};

const polymorphicModule = {
    create(empty, vnode) {
        const el = vnode.elm;
        const { doc } = vnode.data;
        log(`<h4 style="color:green">${JSON.stringify(doc)}</h4>`)
        if (doc) {
            if (doc.type == 'textDocument') {
                const cm = createCodeMirror({el});
                openDoc(doc, cm);
            }
            if (doc.type == 'events') {
                el.innerHTML = 'eVVf';

                const debugView = require('../enter-ghost-debug/gui/bundle');
                console.warn("DDDDdbBBBB", debugView)
                //const dbg = require('../../enter-ghost-debug');
                doc.file.read(contents => {
                    const data = JSON.parse(contents)
                    console.warn("EWENTY",data)
                    debugView({
                        data,
                        el
                    });
                });
                //const events = require('../../enter-ghost-debug/gui/events.json').events;

            }
            if (doc.type == 'appTopBar') {

            }
        }
    },
};

const patch = snabbdom.init([
     require('snabbdom/modules/style'),
     require('snabbdom/modules/eventlisteners'),
     polymorphicModule
]);


module.exports = (el) => {
    let last;


    // let items = [{name: 'kotek'}, {name:'piesek'}];
    // setInterval( () => {
    //     const vnodes = items.map((item, i)=> {
    //         return h('div', {
    //             key: item.name,
    //             hook: {
    //                 create(empty, vnode) {
    //                     vnode.elm.innerHTML += '!';
    //                 },
    //                 update(empty, vnode) {
    //                     vnode.elm.innerHTML += '?';
    //                 }
    //
    //             }
    //         }, item.name);
    //     });
    //     last = patch(last || el, h('div', vnodes));
    //
    // }, 100);
    //
    // setTimeout( () => {
    //     console.log("KANGUARe")
    //     items.unshift(
    //         {name: 'kangurek'}
    //     );
    //
    // }, 4000);
    // return;
    setInterval(() => {
        const { layout } = window.workspace;
        const rows = layout.rows.map((row, i) => {
            if (i ==1) console.log("RRR",row.cells.length)
            const rowStyle = {
                display: 'flex',
                height: `${ row.height || 800 }px`,
                key: i
            };
            const cells = row.cells.filter(cell=>cell.doc.type != 'placeholder').map((cell,i) => {
                console.log("CCC", cell.doc.id)
                const { doc } = cell;
                const style = {
                    color: 'red',
                    //border: '1px solid green',
                    overflow: 'scroll',
                };
                if (cell.width) {
                    style.flexBasis = `${ cell.width }px`;
                }
                const Component = (doc) => {
                    if (components.hasOwnProperty(doc.type)) {
                        const C = components[doc.type];
                        if (C) {
                            return C(doc);
                        }
                    }
                };
                const hook = {
                    ainit(vnode) {
                        log(`<h3>Selektor ${vnode.children || '[]'}</h3>`)

                        const doc = vnode.data.doc;
                        if (doc) {
                            const els = Component(doc);
                            vnode.children = els? [].concat(els) : [];
                            // if (doc.type == 'appTopBar') {
                            //     console.log("XX!!!!SS");
                            //
                            // }
                        }
                    },
                    create(empty, vnode) {
                        const el = vnode.elm;
                        //log(`<h3 style="color:blue">${i}. create: ${cell && cell.doc && cell.doc.file && cell.doc.file.path}</h3><div>${JSON.stringify(vnode)}</div>`);
                    },
                    update(...args) {
                        log(`<h3 style="color:orange">${i}. update: ${cell && cell.doc && cell.doc.file && cell.doc.file.path}</h3>`);
                    },
                    remove(...args) {
                        log(`<h3 style="color:orange">${i}. remove: ${cell && cell.doc && cell.doc.file && cell.doc.file.path}</h3>`);
                    },
                };
                const key = cell.doc.id;


                let children;
                if (doc) {
                    const els = Component(doc);
                    children = els? [].concat(els) : [];
                }
                return h('div', {doc: cell.doc, key, style, hook}, children);
            });

            //cells.unshift(h('input', {attrs:{value:'kotek'}}))
            return h('div', {style: rowStyle}, cells)
        });
        log("<h2>PATCH</h2>");
        last = patch(last || el, h('div', rows));
        log("<br><br>");

    }, 2000);

};
