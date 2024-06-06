Object.defineProperty(exports, '__esModule', { value: true });

const getVercelEnv = require('../common/getVercelEnv.js');
const init$1 = require('../init.js');
const index = require('../index.js');
const currentScopes = require('../current-scopes.js');

function withRibbanConfig(exportedUserNextConfig) {
    return exportedUserNextConfig;
}

function init(options) {
    const newOptions = {
        environment: getVercelEnv.getVercelEnv(true) || process.env.NODE_ENV,
        ...options
    } ;

    init$1.init(newOptions);
}

exports.captureEvent = index.captureEvent;
exports.captureException = index.captureException;
exports.captureMessage = index.captureMessage;
exports.getClient = currentScopes.getClient;
exports.init = init;
exports.withRibbanConfig = withRibbanConfig;
//# sourceMappingURL=index.js.map
