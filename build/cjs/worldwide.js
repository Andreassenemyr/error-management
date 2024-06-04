Object.defineProperty(exports, '__esModule', { value: true });

const GLOBAL_OBJ = globalThis ;

function getGlobalSingleton(name, creator, obj) {
    const gbl = (GLOBAL_OBJ) ;

    const __RIBBAN__ = (gbl.__RIBBAN__ = gbl.__RIBBAN__ || {
        hub: undefined,
        logger: undefined,
        globalScope: undefined,
        defaultCurrentScope: undefined,
        defaultIsolationScope: undefined,
    });

    const singleton = __RIBBAN__[name] || (__RIBBAN__[name] = creator());
    return singleton;
}

exports.GLOBAL_OBJ = GLOBAL_OBJ;
exports.getGlobalSingleton = getGlobalSingleton;
//# sourceMappingURL=worldwide.js.map
