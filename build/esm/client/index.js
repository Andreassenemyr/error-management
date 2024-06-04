import { getVercelEnv } from '../common/getVercelEnv.js';
import { init as init$1 } from '../init.js';
export { captureException } from '../index.js';

function withRibbanConfig(exportedUserNextConfig) {
    return exportedUserNextConfig;
}

function init(options) {
    const newOptions = {
        environment: getVercelEnv() || process.env.NODE_ENV,
        ...options
    } ;

    init$1(newOptions);
}

export { init, withRibbanConfig };
//# sourceMappingURL=index.js.map
