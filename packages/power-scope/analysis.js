function abc() {
    at([10, 2]).scope().pos();



    editor.jumpTo(
        ref.at(pos).def().pos()
    );
    // vs
    const ref = refAt(pos);
    const def = findDef(ref);
    editor.jumpTo(posFrom(def));



}
const { posInLoc } = require('./helpers');

const assert = require('assert');
function Analysis() {
    this.scopes = [];
    this.entities = [];
    this.refs = [];
}

model = require('./naiveModel1').analysisUtil;

Analysis.prototype = {
    getOutline() {
        return this.outline;
    },
    getEntries(scope) {
        return scope.entries;

        console.log("SK@OP", scope.loc.start.line, scope.loc.start.column)
        const entities = this.entities.filter(entity => {
            return entity.scope === scope;
        });
        const o = Object.create(null);

        function visitProps(path, props) {
            props && props.forEach(prop => {
                o[path + '.' + prop.name] = 1;
                visitProps(path + '.' + prop.name, prop.props)
            });

        }

        entities.forEach(entity => {
            o[entity.name] = entity;
            visitProps(entity.name, entity.props);
        });
        console.log("$$$$$$",o)

        return o;
    },
    getScopes() {
        return this.scopes;
    },
    scopeAt(pos) {
        let i = this.scopes.length;
        while (i--) {
            const scope = this.scopes[i];
            if (posInLoc(pos, scope.loc))
                return scope;
        }
    },
    entryAt(pos) {
        const scope = this.scopeAt(pos);
        const entry = Object.keys(scope.entries)
            .map(key => scope.entries[key])
            .find(entry => posInLoc(pos, entry.loc));
        return entry;
    },
    entityAt(pos) {
        return this.entities.find(item => {
            return posInLoc(pos, item.loc);
        });
    },
    rangeOf(item) {
        return item.loc;
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
    // TODO rename -> findDef
    textOf(item) {
        if (item[0] && item[0].isChain) {
            return item.map(part => part.key).join('');
        }
    },
    getEntry(scope, name) {
        return scope.entries[name];
    },
    resolveRef(ref) {

        const name = ref[0].key;
        let scope = ref[0].scope;
        let entity;
        let entries;
        if (!scope) return;
        //console.log("RESOLVE REF", ref.map(p=>p.key).join(''));

        do {
            entries = this.getEntries(scope);
            //console.log('=3==3=3=3=33=', entries)
            entity = this.getEntry(scope, name);
            //entity = this.
            // entity = this.entities.find(entity => {
            //     return entity.scope === scope && entity.name == name;
            // });
            scope = scope.parent;
        } while(!entity && scope);



        if (ref.length > 1) {
            let op = '';
            let curr = entity;
            let path = name;
            for (let i = 1; i < ref.length; i++) {
                if (ref[i].key == '.') {
                    op = 'prop';
                } else {
                    if (op == 'prop' && curr) {
                        path = path + '.' + ref[i].key;
                        curr = entries[path];
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
