// we import `vue/dist/vue` instead of `vue` because of https://github.com/vuejs-templates/webpack/issues/215
const Vue = require('vue/dist/vue');

// mappings (from doc.type to Vue component):
const docComponents = {
    // TODO decide. Files names should be either CamelCase or camelCase, or hyphen-case. There is inconsistency now
    textDocument: require('./TextEditor'),
    appTopBar: require('./AppTopBar'),
    searchResults: require('./searchResults'),
    commandWindow: require('./commandWindow'),
    treeView: require('./treeView'),
    default: {
        props: ['doc'],
        template: `<h4>{{doc.type}}</h4>`
    }
};

const resolveComponentForDoc = doc => {
    return new Promise(resolve => {

        const type = doc.type || 'default';
        const Node = docComponents.hasOwnProperty(type)? docComponents[type] : docComponents.default;

        if (!Node.$select) {

            resolve(Node);
        } else {
            const key = Node.$select({ doc });

            const C = Node[key] || Node.default;

            resolve(C);
        }

    });
}


module.exports = (el) => {


    setTimeout(() => {
        const l = Vue.component('eg-layout', {
            mounted() {
                //this.$refs.place.innerHTML = '<div>axf kacka</div';
            },

            props: ['layout'],
            methods: {
                resolveComponentForDoc,
                log(s) {
                    console.log("TEMPLATE",s)
                },
                resize(cell, params) {
                    cell.width = 30;
                },
                resizeStart(cell, e) {
                    const startX = e.pageX;
                    const startWidth = cell.width;
                    const mouseMove = (e) => {
                        cell.width = startWidth + e.pageX - startX;
                    };
                    const mouseUp = (e) => {
                        document.removeEventListener('mousemove', mouseMove);
                        document.removeEventListener('mouseup', mouseUp);
                        cell.width = startWidth + e.pageX - startX;

                    };
                    document.addEventListener('mouseup', mouseUp);
                    document.addEventListener('mousemove', mouseMove);
                    e.preventDefault();
                },
            },

            template: `
            <div>
                <div ref="place"></div>
                <div v-for="row in layout.rows">
                    <div :style="{height: (row.height||800) + 'px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden',display:'flex'}">
                        <div v-for="(cell, index) in row.cells" :key="cell.doc.id">
                            <div :style="{height: '100%', width: cell.width + 'px', background: '#222'}">
                                <div v-if="true || cell.doc.type == 'textDocument'" style="height:100%;position:relative">
                                    <div
                                        class="resize-handle"
                                        style="z-index:1000;position:absolute;comment__background:rgba(0,255,255,0.1);comment__border:1px solid green;width:16px;
                                        right:-8px;top:0px;height:100%;cursor:ew-resize"
                                        v-on:mousedown="(e) => resizeStart(cell, e)"
                                    >
                                    </div>
                                    <cell-bar :cell="cell"></cell-bar>
                                    <eg-doc :doc="cell.doc" :key="cell.doc.id || Math.random()"><eg-doc>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `,
        });

        Vue.component('tab', require('./Tab'));
        Vue.component('cell', require('./cell'));
        Vue.component('cellBar', require('./cellBar'));
        Vue.component('egMenu', require('./menu'));

        Vue.component('eg-doc', {
            props: ['doc'],
            data() {
                const d = {
                    C: 'button'
                }
                resolveComponentForDoc(this.doc).then(C => {

                    d.C = C;


                });
                return d;
            },
            render(h) {
                return h(this.C, {props: {doc: this.doc}})
            }
        });

        Vue.component('eg-item', {
            props: ['item'],
            data() {
                const d = {
                    C: 'button'
                }
                resolveComponentForDoc(this.item).then(C => {
                    setTimeout(() => {
                        d.C = C;
                    }, 1400);

                });
                return d;
            },
            render(h) {
                return h(this.C, {props: {item: this.item}})
            }
        });

        new Vue({
            el,
            data: () => ({
                workspace: window.workspace,
            }),
            template: `
                <eg-layout :layout='workspace.layout'></eg-layout>
            `
            //render: (h) => h('abc')
        });
    }, 300); // TODO change to sth like workspace.on('ready')
};
