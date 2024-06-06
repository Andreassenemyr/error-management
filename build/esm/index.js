import { getCurrentScope } from './current-scopes.js';
import './utils/logger.js';
import 'uuid';
import './transport/syncpromise.js';
import { parseEventHintOrCaptureContext } from './utils/prepare-event.js';
import './stack-parsers.js';

function captureException(
    exception,
    hint,
) {
    return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
}

function captureEvent(event, hint) {
    return getCurrentScope().captureEvent(event, hint);
}

function captureMessage(
    message,
    level,
    hint,
) {
    return getCurrentScope().captureMessage(message, level, parseEventHintOrCaptureContext(hint));
}

export { captureEvent, captureException, captureMessage };
//# sourceMappingURL=index.js.map
