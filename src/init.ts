import { defaultStackParser } from "./api";
import { Client, NodeClient } from "./client";
import { getCurrentScope } from "./current-scopes";
import { makeNodeTransport } from "./transport/http";
import { NodeClientOptions, NodeOptions } from "./types";
import { stackParserFromStackParserOptions } from "./types/stacktrace";
import { logger } from "./utils/logger";
import { dropUndefinedKeys } from "./utils/object";

export function init(options: NodeOptions | undefined = {}): void {
    const clientOptions = getClientOptions(options);

    if (clientOptions.debug) {
        logger.enable();
    }

    const client = new NodeClient(clientOptions);
    getCurrentScope().setClient(client);

    if (isEnabled(client)) {
        client.init();
    }
};

function getClientOptions(options: NodeOptions): NodeClientOptions {
    const autoSessionTracking = options.autoSessionTracking ?? true;

    const baseOptions = dropUndefinedKeys({
        transport: makeNodeTransport,
        dsn: process.env.RIBBAN_DSN,
        environment: process.env.RIBBAN_ENVIRONMENT,
    });

    const overwriteOptions = dropUndefinedKeys({
        autoSessionTracking,
    });

    const clientOptions: NodeClientOptions = {
        ...baseOptions,
        ...options,
        ...overwriteOptions,       
        stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
    };

    return clientOptions;
}

function isEnabled(client: Client): boolean {
    return client.getOptions().enabled !== false && client.getTransport() !== undefined;
}