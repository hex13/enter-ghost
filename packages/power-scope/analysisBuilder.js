
const { getName } = require('lupa-utils');

const nodeMap = new WeakMap;
global.nodeMap = nodeMap;
module.exports = {
    declareVariable(entity, value, key) {
        //this.analysis.entities.push(Object.assign({props: value}, entity));
        //console.warn("DECLARE", entity);
        const scope = entity.scope;
        if (!scope) {
            console.error("NO SCOPE", entity, new Error)
            return;
        }

        scope.entries[key || entity.name] = Object.assign(entity, value);

        if (this.node.type == 'VariableDeclarator') {
            nodeMap.set(this.parent, scope.entries[key || entity.name]);
        } else
            nodeMap.set(this.node, scope.entries[key || entity.name]);
    },

    declareParamsFrom(node) {
        const state = this;
        node.params.forEach(param => {
            if (param.type == 'Identifier') {
                state.declareVariable({
                    name: param.name,
                    loc: param.loc,
                    scope: state.functionScopes[state.functionScopes.length - 1],
                });
            } else if (param.type == 'ObjectPattern') {
                param.properties.forEach(prop => {
                    state.declareVariable({
                        name: prop.key.name,
                        loc: prop.key.loc,
                        scope: state.functionScopes[state.functionScopes.length - 1],
                    });
                });
            }

        });
    },

    declareProperty(ctx, prop) {
        prop.scope = ctx;
        if (!ctx.entries) throw new Error('😱')
        const key = ctx.name + ctx.path.map(key => '.' + key).join('');
        this.declareVariable(prop, null, key);
    },
    enterObject() {

    },
    exitObject() {
    },
    enterProperty (node) {
        const ctx = this.last('ctx');
        if (!ctx) return;
        ctx.path.push(getName(node));
        return ctx;
    },
    exitProperty (node) {
        const state = this;
        const ctx = state.last('ctx');
        if (!ctx) return;
        if (state.parent.type != 'ObjectExpression') return;


        state.declareProperty(ctx, {
            name: ctx.path[ctx.path.length-1],
            loc: node.key.loc,
        });

        ctx.path.pop();
    },
    declareScope(scope) {
        //console.log("<div style='color:red'>", scope.nodeType, this.ctx[this.ctx.length -2],"</div>")
        const ctx = this.last('ctx');
        //const ctx = (scope.parentType) == 'ArrowFunctionExpression' ? this.ctx[this.ctx.length - 2] : this.last('ctx');
        //console.log('<br/><b>',scope.loc.start.line,scope.loc.start.column, ' ', ctx && ctx.name, '----', ctx && ctx.path.join('.'), '</b>');
        if (scope.parentType == 'ArrowFunctionExpression' && scope.parent && scope.parent.parent) {
            let curr = scope.parent.parent;
            scope.thisPath = curr.thisPath;
            scope.thisScope = curr.thisScope;
        }
        else if (ctx) {
            scope.thisPath = ctx.name;
            scope.thisScope = ctx.scope;
            if (ctx.path.length > 1 ) {
                scope.thisPath += '.' + ctx.path.slice(0, -1).join('.');
            }
        }
        this.analysis.scopes.push(scope);
    },
    declareRef(ref) {
        this.analysis.refs.push(ref);
    },
    declareEntity(node, entity) {
        this.customEntities.push({node, entity});
    }


}
