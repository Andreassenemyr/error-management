Object.defineProperty(exports, '__esModule', { value: true });

const currentScopes = require('../../current-scopes.js');
const stacktrace = require('../../types/stacktrace.js');
const logger = require('../../utils/logger.js');
const object = require('../../utils/object.js');
const http = require('../transports/http.js');
const api = require('./api.js');
const client = require('./client.js');

/**
 * Initialize Sentry for Node, without any integrations added by default.
 */
function init(options = {}) {
    return _init(options);
}

function _init(
    options = {}
) {
    const clientOptions = getClientOptions(options);

    if (clientOptions.debug === true) {
        logger.logger.enable();
    }

    const scope = currentScopes.getCurrentScope();
    scope.update(options.initialScope);

    const client$1 = new client.NodeClient(clientOptions);
    currentScopes.getCurrentScope().setClient(client$1);

    if (isEnabled(client$1)) {
        client$1.init();
    }

    if (options.autoSessionTracking) ;
}

function getClientOptions(options) {
    const release = '1.0.0';

    const autoSessionTracking =
        options.autoSessionTracking === undefined
                ? true
                : options.autoSessionTracking;

    const tracesSampleRate = getTracesSampleRate(options.tracesSampleRate);

    const baseOptions = object.dropUndefinedKeys({
        transport: http.makeNodeTransport,
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT,
    });

    const overwriteOptions = object.dropUndefinedKeys({
        release,
        autoSessionTracking,
        tracesSampleRate,
    });

    const mergedOptions = {
        ...baseOptions,
        ...options,
        ...overwriteOptions,
    };

    const clientOptions = {
        ...mergedOptions,
        stackParser: stacktrace.stackParserFromStackParserOptions(options.stackParser || api.defaultStackParser),
    };

    return clientOptions;
}

function getTracesSampleRate(tracesSampleRate) {
    if (tracesSampleRate !== undefined) {
        return tracesSampleRate;
    }

    const sampleRateFromEnv = process.env.SENTRY_TRACES_SAMPLE_RATE;
    if (!sampleRateFromEnv) {
        return undefined;
    }

    const parsed = parseFloat(sampleRateFromEnv);
    return isFinite(parsed) ? parsed : undefined;
}

function isEnabled(client) {
    return client.getOptions().enabled !== false && client.getTransport() !== undefined;
}

exports.init = init;
//# sourceMappingURL=index.js.map
