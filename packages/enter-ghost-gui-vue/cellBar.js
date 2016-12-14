module.exports = {
    props: ['cell'],
    template: `<div>
        <eg-menu v-if="!cell.hideMenu" :doc="cell.doc"></eg-menu>
        <span v-if="!cell.hidePath" style="color:#666;padding:2px;font-family:'lucida grande', sans-serif;"> {{cell.doc.file.basename()}}</span>
    </div>`
};
