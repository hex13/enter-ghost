
// TODO change code style to space after brackets
const { highlightElement, createCodeMirror, openDoc, closeDoc } = require('enter-ghost-codemirror');


module.exports = {
   props: ['doc'],
   data: () => ({
      phrase: 'React',
   }),
   methods: {
      goTo(path) {
          console.log("GO TO", path)
          window.app.emit('open', {
              paths: [path]
          })
      },
      search() {
          window.app.emit('do-find-in-files', {doc: this.doc, phrase: this.phrase});
      }
   },
   template: `<div style="font-family:sans-serif;color:#ccc;height:100%;overflow:scroll;background:#263238">
   <input type="text" v-model="phrase">
   <button v-on:click="search()">search</button>
   <div v-for="item in doc.items" v-on:click="goTo(item.file.path)" style="cursor:pointer">
      <div>{{ item.file.basename() }}</div>
      <pre ref="code" data-mode="text/javascript">{{ item.text }}</pre>
   </div>
   </div>
   `,
   mounted() {
    console.log("MOUNTED", this.$refs)
    if (this.$refs.code) this.$refs.code.forEach(el => {
        highlightElement(el);
    });
       //
    //    const cm = createCodeMirror({
    //        el: this.$refs.cm,
    //        suggest: () => {}
    //    });
       //
    //    const s = this.doc.items.reduce((s, item) => s + item.path + '\n','')
    //    cm.setValue(s);
       //

   }
};
