Object.defineProperty(exports, '__esModule', { value: true });

const getVercelEnv = require('../common/getVercelEnv.js');
const init$1 = require('../init.js');
const index = require('../index.js');

function withRibbanConfig(exportedUserNextConfig) {
    return exportedUserNextConfig;
}

function init(options) {
    const newOptions = {
        environment: getVercelEnv.getVercelEnv() || process.env.NODE_ENV,
        ...options
    } ;

    init$1.init(newOptions);
}

exports.captureException = index.captureException;
exports.init = init;
exports.withRibbanConfig = withRibbanConfig;
//# sourceMappingURL=index.js.map
