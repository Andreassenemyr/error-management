Object.defineProperty(exports, '__esModule', { value: true });

const getVercelEnv = require('../common/getVercelEnv.js');
const isBuild = require('../common/isBuild.js');
const currentScopes = require('../current-scopes.js');
const logger = require('../utils/logger.js');
require('../node/proxy/index.js');
require('../transport/syncpromise.js');
require('node:http');
require('node:https');
require('node:stream');
require('node:zlib');
require('@opentelemetry/api');
require('@opentelemetry/core');
const index$1 = require('../node/sdk/index.js');
const withRibbanConfig = require('../config/withRibbanConfig.js');
require('fs');
require('path');
require('resolve');
const index = require('../index.js');

function init(options) {
    if (isBuild.isBuild()) {
        return;
    }

    const newOptions = {
        environment: getVercelEnv.getVercelEnv(false) || process.env.NODE_ENV,
        ...options,
        autoSessionTracking: false
    };

    if (options.debug) {
        logger.logger.enable();
    }

    logger.logger.log('Initializing Ribban o0.');

    if (sdkAlreadyInitialized()) {
        logger.logger.log('SDK already initialized. Skipping initialization.');
        return;
    }

    index$1.init(newOptions);

    currentScopes.getClient();

    logger.logger.log('Ribban o0 initialized.');
}
function sdkAlreadyInitialized() {
    return !!currentScopes.getClient();
}

exports.withRibbanConfig = withRibbanConfig.withRibbanConfig;
exports.captureEvent = index.captureEvent;
exports.captureException = index.captureException;
exports.captureMessage = index.captureMessage;
exports.init = init;
//# sourceMappingURL=index.js.map
