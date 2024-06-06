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
    return currentScopes.getCurrentScope().captureException(exception, prepareEvent.parseEventHintOrCaptureContext(hint));
}

function captureEvent(event, hint) {
    return currentScopes.getCurrentScope().captureEvent(event, hint);
}

function captureMessage(
    message,
    level,
    hint,
) {
    return currentScopes.getCurrentScope().captureMessage(message, level, prepareEvent.parseEventHintOrCaptureContext(hint));
}

exports.captureEvent = captureEvent;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
//# sourceMappingURL=index.js.map
