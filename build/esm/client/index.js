import { getVercelEnv } from '../common/getVercelEnv.js';
import { init as init$1 } from '../init.js';
export { captureEvent, captureException, captureMessage } from '../index.js';
export { getClient } from '../current-scopes.js';

function withRibbanConfig(exportedUserNextConfig) {
    return exportedUserNextConfig;
}

function init(options) {
    const newOptions = {
        environment: getVercelEnv(true) || process.env.NODE_ENV,
        ...options
    } ;

    init$1(newOptions);
}

export { init, withRibbanConfig };
//# sourceMappingURL=index.js.map
