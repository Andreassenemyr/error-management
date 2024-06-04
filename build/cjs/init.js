Object.defineProperty(exports, '__esModule', { value: true });

const client = require('./client.js');
const currentScopes = require('./current-scopes.js');
const stackParsers = require('./stack-parsers.js');
const fetch = require('./transport/fetch.js');
const stacktrace = require('./types/stacktrace.js');
const logger = require('./utils/logger.js');

function init(options = {}) {
    const newOptions = applyDefaultOptions(options);

    console.log('Test Client');

    const clientOptions = {
        ...newOptions,
        stackParser: stacktrace.stackParserFromStackParserOptions(options.stackParser || stackParsers.defaultStackParser),
        transport: options.transport || fetch.makeFetchTransport,
    };

    initAndBind(client.BrowserClient, clientOptions);
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
        logger.logger.enable();
    }
    const scope = currentScopes.getCurrentScope();
    scope.update(options.initialScope);

    const client$1 = new clientClass(options);
    client.setCurrentClient(client$1);
    client$1.init();
}

exports.init = init;
//# sourceMappingURL=init.js.map
