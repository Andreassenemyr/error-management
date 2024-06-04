import { setCurrentClient, BrowserClient } from './client.js';
import { getCurrentScope } from './current-scopes.js';
import { defaultStackParser } from './stack-parsers.js';
import { makeFetchTransport } from './transport/fetch.js';
import { stackParserFromStackParserOptions } from './types/stacktrace.js';
import { logger } from './utils/logger.js';

function init(options = {}) {
    const newOptions = applyDefaultOptions(options);

    console.log('Test Client');

    const clientOptions = {
        ...newOptions,
        stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
        transport: options.transport || makeFetchTransport,
    };

    initAndBind(BrowserClient, clientOptions);
}

function applyDefaultOptions(options = {}) {
    const defaultOptions = {
        autoSessionTracking: true,
    };

    return { ...defaultOptions, ...options };
}

function initAndBind(
    clientClass,
    options
) {
    if (options.debug === true) {
        logger.enable();
    }
    const scope = getCurrentScope();
    scope.update(options.initialScope);

    const client = new clientClass(options);
    setCurrentClient(client);
    client.init();
}

export { init };
//# sourceMappingURL=init.js.map
