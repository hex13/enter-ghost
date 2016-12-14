module.exports = {
    name: 'treeview',
    props: ['doc'],
    mounted() {
        const getData = () => {
            const root = window.app.get('projectRoot');
            if (root && root !== this.items[0]) {
                console.log("AAAAA", root)
                this.items = [root];
            }
        };
        getData();
        setInterval(getData, 2000);
    },
    data: () => ({
        items: [
        ]
    }),
    components: {
        file: {
            methods: {
                toggle(e) {
                    this.open = !this.open;
                    e && e.stopPropagation();
                },
                openItem(item) {
                    if (item.isDirectory) {
                        this.toggle();
                    } else {
                        window.workspace.command('open', {paths: [item.file.path]});
                    }
                }
            },
            name: 'file',
            props: ['item'],
            data: () => ({
                open: false
            }),
            template: `<div style="cursor:default">
                <span v-if="item.children.length" v-on:click="toggle">{{ open? 'C' : 'O' }}</span>
                <span v-on:click="openItem(item)" :style="{color: item.isDirectory? '#b96': '#aaa'}">{{ item.file.basename() }}</span>
                <ul v-if="open">
                    <li v-for="item in item.children">
                        <file :item="item"></file>
                    </li>
                </ul>
            </div>`
        }
    },
    template: `<div style="overflow:scroll;height:100%">
        <ul>
            <li v-for="file in items">
                <file :item="file"></file>
            </li>
        </ul>
    </div>`
};
