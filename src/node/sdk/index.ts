import { Client } from "../../client";
import { getCurrentScope } from "../../current-scopes";
import { stackParserFromStackParserOptions } from "../../types/stacktrace";
import { logger } from "../../utils/logger";
import { dropUndefinedKeys } from "../../utils/object";
import { makeNodeTransport } from "../transports";
import { NodeClientOptions, NodeOptions } from "../types";
import { defaultStackParser } from "./api";
import { NodeClient } from "./client";

/**
 * Initialize Sentry for Node, without any integrations added by default.
 */
export function init(options: NodeOptions | undefined = {}): void {
    return _init(options);
}

function _init(
    options: NodeOptions | undefined = {}
): void {
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

    if (options.autoSessionTracking) {
        startSessionTracking();
    }
}

function getClientOptions(options: NodeOptions): NodeClientOptions {
    const release = '1.0.0';

    const autoSessionTracking =
        typeof release !== 'string'
            ? false
            : options.autoSessionTracking === undefined
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

    const clientOptions: NodeClientOptions = {
        ...mergedOptions,
        stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
    };

    return clientOptions;
}

function getTracesSampleRate(tracesSampleRate: NodeOptions['tracesSampleRate']): number | undefined {
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

function isEnabled(client: Client): boolean {
    return client.getOptions().enabled !== false && client.getTransport() !== undefined;
}

function startSessionTracking(): void {

};