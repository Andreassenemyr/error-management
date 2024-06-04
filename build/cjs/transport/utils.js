Object.defineProperty(exports, '__esModule', { value: true });

const helpers = require('../helpers/helpers.js');
const logger = require('../utils/logger.js');

function isNativeFetch(func) {
    return func && /^function fetch\(\)\s+\{\s+\[native code\]\s+\}$/.test(func.toString());
}

let cachedFetchImpl = undefined;

function getNativeFetchImplementation() {
    if (cachedFetchImpl) {
        return cachedFetchImpl;
    }

    /* eslint-disable @typescript-eslint/unbound-method */

    // Fast path to avoid DOM I/O
    if (isNativeFetch(helpers.WINDOW.fetch)) {
        return (cachedFetchImpl = helpers.WINDOW.fetch.bind(helpers.WINDOW));
    }

    const document = helpers.WINDOW.document;
    let fetchImpl = helpers.WINDOW.fetch;
    // eslint-disable-next-line deprecation/deprecation
    if (document && typeof document.createElement === 'function') {
        try {
            const sandbox = document.createElement('iframe');
            sandbox.hidden = true;
            document.head.appendChild(sandbox);
            const contentWindow = sandbox.contentWindow;
            if (contentWindow && contentWindow.fetch) {
                fetchImpl = contentWindow.fetch;
            }

            document.head.removeChild(sandbox);
        } catch (e) {
            logger.logger.warn('Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ', e);
        }
    }

    try {
        return (cachedFetchImpl = fetchImpl.bind(helpers.WINDOW));
    } catch (e) {
        // empty
    }

    return undefined;
    /* eslint-enable @typescript-eslint/unbound-method */
  }

/** Clears cached fetch impl */
function clearCachedFetchImplementation() {
    cachedFetchImpl = undefined;
}

exports.clearCachedFetchImplementation = clearCachedFetchImplementation;
exports.getNativeFetchImplementation = getNativeFetchImplementation;
exports.isNativeFetch = isNativeFetch;
//# sourceMappingURL=utils.js.map
