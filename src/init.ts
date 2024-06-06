import { BrowserClient, BrowserClientOptions, Client, setCurrentClient } from "./client";
import { getCurrentScope } from "./current-scopes";
import { ClientOptions } from "./options";
import { defaultStackParser } from "./stack-parsers";
import { makeFetchTransport } from "./transport/fetch";
import { BrowserOptions } from "./types";
import { stackParserFromStackParserOptions } from "./types/stacktrace";
import { logger } from "./utils/logger";
import { dropUndefinedKeys } from "./utils/object";

export function init(options: BrowserOptions = {}): void {
    const newOptions = applyDefaultOptions(options);

    console.log('Test Client')
    
    const clientOptions: BrowserClientOptions = {
        ...newOptions,
        stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
        transport: options.transport || makeFetchTransport,
    };

    initAndBind(BrowserClient, clientOptions);
}

function applyDefaultOptions(options: BrowserOptions = {}): BrowserOptions {
    const defaultOptions: BrowserOptions = {
        autoSessionTracking: true,
    };

    return { ...defaultOptions, ...options };
}

export type ClientClass<F extends Client, O extends ClientOptions> = new (options: O) => F;

function initAndBind<F extends Client, O extends ClientOptions>(
    clientClass: ClientClass<F, O>,
    options: O
): void {
    if (options.debug === true) {
        logger.enable();
    };

    const scope = getCurrentScope();
    scope.update(options.initialScope);
    
    const client = new clientClass(options);
    setCurrentClient(client);
    client.init();
}
