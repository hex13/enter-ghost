const {filter} = require('fuzzaldrin');

module.exports = {
   props: ['doc'],
   data: () => ({
      phrase: 'index',
      selected: 0
   }),
   updated() {
       console.log("NOTYFIKACJA");

   },
   computed: {

       filtered() {

           const res = filter(this.doc.files, this.phrase, {key:'path'});
           console.log("KKKKK computer", res)
           return res;
        //    return this.doc.files.filter(file => {
        //        return file.indexOf(this.phrase) != -1;
        //    })
        },

   },
   methods: {
        keyDown(e) {

            const len = this.filtered.length;
            let handled = true;
            if(e.keyCode == 38) {
                this.selected = (len + this.selected - 1) % len;
            }
            else if(e.keyCode == 40) {
                this.selected = (len + this.selected + 1) % len;
            } else if (e.keyCode == 13) {
                const path = this.filtered[this.selected].path;
                window.app.emit('open', {paths: [path]})
                //require('workspace').findInFiles
            } else {
                handled = false;
            }

            if (handled) e.preventDefault();
            console.log("KKK",e.keyCode, this.filtered.length, this.selected);

            console.log("EEEE",  e.keyCode);
        }
   },
   template: `
   <div style="height:100%;overflow:scroll;">
      <input type="text" v-model="phrase" v-on:keydown="keyDown"/>sss
      <ul>
        <li v-for="(item, index) in filtered" :style="{background: index == selected? '#55a' : 'transparent'}" >
            {{ item.path }}
        </li>
      </ul>
   </div>
   `,
};
