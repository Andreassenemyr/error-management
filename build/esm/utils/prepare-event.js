import { v4 } from 'uuid';
import { resolvedSyncPromise } from '../transport/syncpromise.js';
import { Scope } from '../scope.js';

function prepareEvent(
    options,
    event,
    hint,
    scope,
    client,
) {
    const prepared = {
        ...event,
        event_id: event.event_id || hint.event_id || v4(),
        timestamp : event.timestamp || new Date().getSeconds(),
    };

    applyClientOptions(prepared, options);

    return resolvedSyncPromise(prepared);
}
function applyClientOptions(event, options) {
    const { environment, maxValueLength = 250 } = options;

    if (!('environment' in event)) {
        event.environment = 'environment' in options ? environment : 'production';
    }

    if (event.message) {
        event.message = event.message.substring(0, maxValueLength);
    }

    const request = event.request;
    if (request && request.url) {
        request.url = request.url.substring(0, maxValueLength);
    }
}

function parseEventHintOrCaptureContext(
    hint,
) {
    if (!hint) {
      return undefined;
    }

    // If you pass a Scope or `() => Scope` as CaptureContext, we just return this as captureContext
    if (hintIsScopeOrFunction(hint)) {
      return { captureContext: hint };
    }

    if (hintIsScopeContext(hint)) {
      return {
        captureContext: hint,
      };
    }

    return hint;
}

function hintIsScopeOrFunction(
    hint,
) {
    return hint instanceof Scope || typeof hint === 'function';
}

const captureContextKeys = [
  'level',
  'extra',
  'tags',
  'fingerprint',
  'requestSession',
] ;

function hintIsScopeContext(hint) {
  return Object.keys(hint).some(key => captureContextKeys.includes(key ));
}

export { parseEventHintOrCaptureContext, prepareEvent };
//# sourceMappingURL=prepare-event.js.map
