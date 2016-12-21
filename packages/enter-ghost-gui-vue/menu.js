module.exports = {
    props: ['doc'],
    methods: {
        click() {
            window.app.emit('close-document', {doc: this.doc});

            //alert('kliknales ' + this.doc.file.path);

            // TODO API proposal
           	//this.doc.close()

        }
    },
    template: `<button style="background:none;color:#aaa;border:none" v-on:click="click">㆔</button>`
};
