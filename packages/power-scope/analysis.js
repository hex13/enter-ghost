const { posInLoc } = require('./helpers');

const assert = require('assert');
function Analysis() {
    this.scopes = [];
    this.entities = [];
    this.refs = [];
}

model = require('./naiveModel1').analysisUtil;

Analysis.prototype = {
    getScopes() {
        return this.scopes;
    },
    entityAt(pos) {
        return this.entities.find(item => {
            return posInLoc(pos, item.loc);
        });
    },
    refAt(pos) {
        for (let ri = 0; ri < this.refs.length; ri++) {
            const item = this.refs[ri];

            if(!item[0].loc) continue;
            for (let i = 0; i < item.length; i++) {
                const loc = item[i].loc;
                if (loc && posInLoc(pos, loc)) {
                    return item.slice(0, i + 1);
                }
            }
        }
        // return this.refs.find(item => {
        // });
    },
    resolveRef(ref) {
        const name = ref[0].key;
        let scope = ref[0].scope;
        let entity;
        if (!scope) return;
        console.log("RESOLVE REF", ref.map(p=>p.key).join(''));
        do {
            entity = this.entities.find(entity => {
                return entity.scope === scope && entity.name == name;
            });
            scope = scope.parent;
        } while(!entity && scope);

        if (ref.length > 1) {
            let op = '';
            let curr = entity;
            for (let i = 1; i < ref.length; i++) {
                if (ref[i].key == '.') {
                    op = 'prop';
                } else {
                    if (op == 'prop' && curr && model.hasProps(curr)) {
                        curr = model.getProperty(curr, ref[i].key);
                    } else {
                        return;
                    }
                    if (!curr)  {
                        return
                        //console.log("!!!!!ZN", ref.map(p=>p.key).join(''))
                    }

                }
            }
            return curr;
        }
        return entity;
    },
    refsFor(def) {
        return def.refs;
    },
    postprocess() {
        this.refs.forEach(ref_ => {
            const ref = ref_.slice();
            while (ref.length) {
                const entity = this.resolveRef(ref);
                if (entity) {
                    //console.log("YYYY", ref.map(part=>part.key).join(''));
                    entity.refs = entity.refs || [];
                    entity.refs.push(ref.slice());
                }
                ref.pop();
                if (ref.length && ref[ref.length - 1].key == '.') ref.pop();
            }
            //console.log("YYYYY", entity);
            //console.log("REFIK", ref.map(part=>part.key).join(''));
        });
    }
};

module.exports = Analysis;
