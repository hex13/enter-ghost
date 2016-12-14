exports.createEmitter = (dispatch, locals = {}) => {
    return new Proxy({}, {
        get: (a,meth) => {
            if (meth in locals)
                return locals[meth];
            return (...args) => {
                 return dispatch({
                     type: 'request',
                     name: meth,
                     args,
                 });
            }
        }
    });
}
