import { getVercelEnv } from '../common/getVercelEnv.js';
import { isBuild } from '../common/isBuild.js';
import { getClient } from '../current-scopes.js';
import { logger } from '../utils/logger.js';
import '../node/proxy/index.js';
import '../transport/syncpromise.js';
import 'node:http';
import 'node:https';
import 'node:stream';
import 'node:zlib';
import '@opentelemetry/api';
import '@opentelemetry/core';
import { init as init$1 } from '../node/sdk/index.js';
export { withRibbanConfig } from '../config/withRibbanConfig.js';
import 'fs';
import 'path';
import 'resolve';
export { captureEvent, captureException, captureMessage } from '../index.js';

function init(options) {
    if (isBuild()) {
        return;
    }

    const newOptions = {
        environment: getVercelEnv(false) || process.env.NODE_ENV,
        ...options,
        autoSessionTracking: false
    };

    if (options.debug) {
        logger.enable();
    }

    logger.log('Initializing Ribban o0.');

    if (sdkAlreadyInitialized()) {
        logger.log('SDK already initialized. Skipping initialization.');
        return;
    }

    init$1(newOptions);

    getClient();

    logger.log('Ribban o0 initialized.');
}
function sdkAlreadyInitialized() {
    return !!getClient();
}

export { init };
//# sourceMappingURL=index.js.map
