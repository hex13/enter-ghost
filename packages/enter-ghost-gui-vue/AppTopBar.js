module.exports = {
   props: ['doc'],
   methods: {
       activate(doc) {
           window.workspace.emit('activate', {doc});
       }
   },
   template: `
   <div style="display:flex;height:100%;">
        <div v-for="doc in doc.docs" v-on:click="activate(doc)">
            <tab :doc="doc"></tab>
        </div>
   </div>
   `,
};
