
// TODO change code style to space after brackets

const { createCodeMirror, openDoc, closeDoc } = require('./external/codemirror-helpers');


module.exports = {
   props: ['doc'],
   template: `<div ref="cm" :style="{height: '100%'}">
   </div>
   `,
   mounted() {
       console.log("MOUNTED", createCodeMirror)
       try {
           const cm = createCodeMirror({
               el: this.$refs.cm,
               suggest: () => {}
           });

           openDoc(this.doc, cm);
           this.interval = setInterval(() => this.doc.emit('refresh'), 700);
           window.TEST_MAP.set(this.doc.file.path, cm);
       }catch(e) {
            console.log("EEERRR",e)
       }

   },
   destroyed() {
       console.log("DDDDDDDD", this.interval);
       clearInterval(this.interval);
   }
};
