module.exports = {
   name: 'AppTopBar',
   props: ['doc'],
   mounted() {

     setInterval(() => {

         this.$forceUpdate();
     }, 70)
   },
   updated() {

   },
   methods: {
       activate(doc) {
           window.workspace.emit('activate', {doc});
       },
       tabs() {
           const originalTabs = this.doc.docs;
//            const tabs = originalTabs.slice(0);
//            const n= Date.now();
//
// //            tabs.map(t=>[t.file.basename(),n-t.file.timestamp,]).join(':')
//
//
//            tabs.forEach(t => t.activityLevel = 0 );
//            tabs.sort((a, b) => {
//
//              return (a.file.timestamp || 0) < (b.file.timestamp || 0)
//            });
//            tabs[0] && (tabs[0].activityLevel = 3);
//            tabs[1] && (tabs[1].activityLevel = 2);
//            tabs[2] && (tabs[2].activityLevel = 1);
           return originalTabs;
       }

   },
   computed: {
     tab1s() {
         const tabs = this.doc.docs.slice(0);
         tabs.sort((a, b) => a.file.timestamp > b.file.timestamp);
         return tabs;
     }
   },
   template: `
   <div style="display:flex;height:100%;width:90vw;border: 1px solid green">
        <div v-for="doc in tabs()" v-on:click="activate(doc)"
            :style="{
				color: ['#777', '#898', '#8a8', '#8b8', '#8c8', '#8e8'][doc.activityLevel || 0],
				borderBottom: doc.activityLevel == 5? '2px solid rgba(200, 250, 200, 0.4)' : (doc.activityLevel == 4? '2px dotted rgba(200, 250, 200, 0.2)'  : 'none'),
                marginBottom: '2px',
                flexGrow: 1,
                flexShrink: doc.activityLevel > 4? 0 : (doc.activityLevel > 0? 1 : 4),
                whiteSpace: 'nowrap',
                aawidth: '100%',
                maxWidth: '100px',
                overflow: 'hidden',
                minWidth: 0,
                transition: '0.3s all',

			}"
        >
            <tab :doc="doc"></tab>
        </div>
   </div>
   `,
};
