Object.defineProperty(exports, '__esModule', { value: true });

const currentScopes = require('./current-scopes.js');
require('./utils/logger.js');
require('uuid');
require('./transport/syncpromise.js');
const prepareEvent = require('./utils/prepare-event.js');
require('./stack-parsers.js');

function captureException(
    exception,
    hint,
) {
    console.log('We got exception', exception.message);

    return currentScopes.getCurrentScope().captureException(exception, prepareEvent.parseEventHintOrCaptureContext(hint));
}

exports.captureException = captureException;
//# sourceMappingURL=index.js.map
