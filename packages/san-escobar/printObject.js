function isPrimitive(o) {
    return typeof o === 'boolean' || typeof o == 'number' || typeof o == 'string' || typeof o == 'undefined' || o === null;
}

const SIC = Symbol('sic');

function createTreeFromObject(o, visited = new WeakMap) {
    if (o && typeof o == 'object') {
        if (visited.get(o)) {
           return Symbol.for('circular');
       }
       visited.set(o, true);
    }

    if (typeof o == 'function') {
        return o;
    }

    if (isPrimitive(o)) {
        return o;
    }

    return {
            props: Object.keys(o).map(k => {
                return {
                    name: k,
                    value: createTreeFromObject(o[k], visited)
                }
            })
    }
}


const h = require('snabbdom/h').default;
const modules = require('snabbdom-to-html/modules')

const toHtml = require('snabbdom-to-html/init')([
    modules.attributes,
]);

let idCounter = 0;
function createId() {
    return 'el_' + (++idCounter);
};

const escapeHtml = s => s.replace(/</g, '&lt;');

function getType(node) {
    if (node === Symbol.for('circular')) {
        return 'circular';
    }
    if (typeof node == 'boolean') {
        return node? 'boolean.true' : 'boolean.false';
    }
    if (node === null) {
        return 'null';
    }
    if (typeof node == 'string') {
        if (node.includes('/')) {
            return 'string.path';
        }
    }
    return typeof node;
    // if (typeof node == 'function') return 'function';
    // if (typeof node == 'number') return 'number';
    // if (typeof node == 'number') return 'number';
    // return 'something';
}
function createElementsFromNode(node, indent = 0) {
    if (node === undefined) return h('span.value.undefined', 'undefined ∅');
    if (typeof node == 'function') return h('em.value.function', 'function');
    if (node === null) return h('span.value.null', 'null ∅');
    if (typeof node == 'boolean') {
        //return h(`input.${getType(node)}`, {attrs: {type: 'checkbox', checked: node || '', disabled: true}}, 'ss');
        return h(`span.value.${getType(node)}`, node? 'true ✓' : 'false 𐄂');

    }

    let repr = '???';
    const hidden = indent > 0 && (node && node.props && node.props.length);
    if (node && node.props) {
        const id = createId();
        return h(
            'span',
            [
                '{ ',
                `<button class="toggle${!hidden?' hide':''}" data-el="${id}">${hidden? '...' : 'x'}</button>`,
                h(`ul#${id}` + (hidden? '.hidden' : ''), node.props.map(p => {
                    return h(
                            'li',
                            [
                                h(`b.name.${getType(p.value)}`, escapeHtml(p.name)),
                                ': ',
                                createElementsFromNode(p.value, indent + 1)
                            ]
                    );
                })),
                ' }'
            ]
        );
    }
    if (isPrimitive(node)) {
        repr = JSON.stringify(node);
    }
    if (node === Symbol.for('circular')) {
        repr = '(circular) 🔙';
    }
    return h(`span.value.${getType(node)}`, escapeHtml(repr))
}

function printObject(o) {
    if (o && typeof o == 'object' && SIC in o) {
        return o[SIC];
    }

    return toHtml(
        createElementsFromNode(
            createTreeFromObject(o)
        )
    );
};


module.exports = {
    printObject,
    sic: o => (
        {[SIC]: o}
    ),
};
