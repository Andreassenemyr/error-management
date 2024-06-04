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
    console.log('We got exception', exception.message);

    return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
}

export { captureException };
//# sourceMappingURL=index.js.map
