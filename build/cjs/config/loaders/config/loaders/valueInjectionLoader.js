Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Set values on the global/window object at the start of a module.
 *
 * Options:
 *   - `values`: An object where the keys correspond to the keys of the global values to set and the values
 *        correspond to the values of the values on the global object. Values must be JSON serializable.
 */
function valueInjectionLoader( userCode) {
    // We know one or the other will be defined, depending on the version of webpack being used
    const { values } = 'getOptions' in this ? this.getOptions() : this.query;

    // We do not want to cache injected values across builds
    this.cacheable(false);

    // Define some global proxy that works on server and on the browser.
    let injectedCode =
        'var _sentryCollisionFreeGlobalObject = typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : {};\n';

    Object.entries(values).forEach(([key, value]) => {
        injectedCode += `_sentryCollisionFreeGlobalObject["${key}"] = ${JSON.stringify(value)};\n`;
    });

    return `${injectedCode}\n${userCode}`;
}

exports.default = valueInjectionLoader;
//# sourceMappingURL=valueInjectionLoader.js.map
