exports.lookupBinding = function lookupBinding(scope, name) {
    do {
        const binding = scope.vars.get(name);
        if (binding) {
            return binding;
        }
        scope = scope.outerScope;
    } while (scope);

}
