import { createEnvelope, serializeEnvelope } from '../envelope.js';
import { RibbanError } from '../utils/error.js';
import { logger } from '../utils/logger.js';
import { makePromiseBuffer } from './promisebuffer.js';
import { resolvedSyncPromise } from './syncpromise.js';

function createTransport(
    options,
    makeRequest,
    buffer = makePromiseBuffer(
        options.bufferSize || 64
    ),
) {
    const flush = (timeout) => buffer.drain(timeout);

    function send(envelope) {
        const filteredEnvelopeItems = [];

        forEachEnvelopeItem(envelope, (item, type) => {
            filteredEnvelopeItems.push(item);
        });

        if (filteredEnvelopeItems.length == 0) {
            return resolvedSyncPromise({});
        }

        const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems );

        const recordEnvelopeLoss = (reason) => {
            forEachEnvelopeItem(filteredEnvelope, (item, type) => {
                getEventForEnvelopeItem(item, type);

            });
        };

        const requestTask = () =>
            makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
                response => {
                    if (response.statusCode !== undefined && (response.statusCode < 200 && response.statusCode >= 300)) {
                        console.warn(`Ribban responded with status code ${response.statusCode} to sent event.`);
                    }

                    return response;
                },
                error => {
                    recordEnvelopeLoss();
                    throw error;
                }
            );

        return buffer.add(requestTask).then(
            result => result,
            error => {
                if (error instanceof RibbanError) {
                    logger.warn('Skipped sending event because buffer is full.');
                    recordEnvelopeLoss();
                    return resolvedSyncPromise({});
                } else {
                    throw error;
                }
            }
        )
    }

    return {
        send: send,
        flush: flush,
    }
}

function forEachEnvelopeItem(
    envelope,
    callback,
  ) {
    const envelopeItems = envelope[1];

    for (const envelopeItem of envelopeItems) {
      const envelopeItemType = envelopeItem[0].type;
      const result = callback(envelopeItem, envelopeItemType);

      if (result) {
        return true;
      }
    }

    return false;
}

function getEventForEnvelopeItem(item, type) {
    if (type !== 'event' && type !== 'transaction') {
      return undefined;
    }

    return Array.isArray(item) ? (item )[1] : undefined;
}

export { createTransport, forEachEnvelopeItem };
//# sourceMappingURL=base.js.map
