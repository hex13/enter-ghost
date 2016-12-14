module.exports = {
    props: ['doc'],
    methods: {
        click() {
            alert('kliknales ' + this.doc.file.path);
           	//this.doc.close()

        }
    },
    template: `<button style="background:none;color:#aaa;border:none" v-on:click="click">㆔</button>`
};
