import { getCurrentScope } from '../../current-scopes.js';
import { stackParserFromStackParserOptions } from '../../types/stacktrace.js';
import { logger } from '../../utils/logger.js';
import { dropUndefinedKeys } from '../../utils/object.js';
import { makeNodeTransport } from '../transports/http.js';
import { defaultStackParser } from './api.js';
import { NodeClient } from './client.js';

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
        logger.enable();
    }

    const scope = getCurrentScope();
    scope.update(options.initialScope);

    const client = new NodeClient(clientOptions);
    getCurrentScope().setClient(client);

    if (isEnabled(client)) {
        client.init();
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

    const baseOptions = dropUndefinedKeys({
        transport: makeNodeTransport,
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT,
    });

    const overwriteOptions = dropUndefinedKeys({
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
        stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
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

export { init };
//# sourceMappingURL=index.js.map
