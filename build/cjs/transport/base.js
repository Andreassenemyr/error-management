Object.defineProperty(exports, '__esModule', { value: true });

const envelope = require('../envelope.js');
const error = require('../utils/error.js');
const logger = require('../utils/logger.js');
const promisebuffer = require('./promisebuffer.js');
const syncpromise = require('./syncpromise.js');

function createTransport(
    options,
    makeRequest,
    buffer = promisebuffer.makePromiseBuffer(
        options.bufferSize || 64
    ),
) {
    const flush = (timeout) => buffer.drain(timeout);

    function send(envelope$1) {
        const filteredEnvelopeItems = [];

        forEachEnvelopeItem(envelope$1, (item, type) => {
            filteredEnvelopeItems.push(item);
        });

        if (filteredEnvelopeItems.length == 0) {
            return syncpromise.resolvedSyncPromise({});
        }

        const filteredEnvelope = envelope.createEnvelope(envelope$1[0], filteredEnvelopeItems );

        const recordEnvelopeLoss = (reason) => {
            forEachEnvelopeItem(filteredEnvelope, (item, type) => {
                getEventForEnvelopeItem(item, type);

            });
        };

        const requestTask = () =>
            makeRequest({ body: envelope.serializeEnvelope(filteredEnvelope) }).then(
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
            error$1 => {
                if (error$1 instanceof error.RibbanError) {
                    logger.logger.warn('Skipped sending event because buffer is full.');
                    recordEnvelopeLoss();
                    return syncpromise.resolvedSyncPromise({});
                } else {
                    throw error$1;
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

exports.createTransport = createTransport;
exports.forEachEnvelopeItem = forEachEnvelopeItem;
//# sourceMappingURL=base.js.map
