import { getEnvelopeEndpointWithUrlEncodedAuth } from './api.js';
import { createDSN } from './dsn.js';
import { logger } from './utils/logger.js';
import { v4 } from 'uuid';
import { checkOrSetAlreadyCaught, parseSampleRate } from './utils/misc.js';
import { resolvedSyncPromise, SyncPromise, rejectedSyncPromise, isThenable } from './transport/syncpromise.js';
import { RibbanError } from './utils/error.js';
import { createSessionEnvelope, createEventEnvelope } from './envelope.js';
import { prepareEvent } from './utils/prepare-event.js';
import { isPrimitive, isPlainObject } from './utils/object.js';
import { getIsolationScope } from './current-scopes.js';

class BaseClient {

    constructor(options) {
        this.options = options;
        this._numProcessing = 0;

        if (options.dsn) {
            this._dsn = createDSN(options.dsn);
        } else {
            logger.warn('No DSN was provided, the client will not send any requests.');
        }

        console.log(this._dsn);

        if (this._dsn) {
            const url = getEnvelopeEndpointWithUrlEncodedAuth(
                this._dsn,
                this.options.tunnel
            );

            this._transport = options.transport({
                tunnel: this.options.tunnel,
                ...options.transportOptions,
                url: url,
            });
        }
    }

     captureException(exception, hint, currentScope) {
        const eventId = v4();

        if (checkOrSetAlreadyCaught(exception)) {
            logger.log('An exception has been already caught, will not send it again');
            return eventId;
        }

        console.log("Message in BaseClient: " + exception.message);

        const hintWithEventId = {
            event_id: eventId,
            ...hint,
        };

        this._process(this.eventFromException(exception, hintWithEventId).then((event) =>
            this._captureEvent(event, hintWithEventId, currentScope),
        ));

        console.log(hintWithEventId.event_id);

        return hintWithEventId.event_id;
    };

    sendSession(session) {
        const env = createSessionEnvelope(session, this._dsn, this.options.tunnel);

        this.sendEnvelope(env);
    }

    captureEvent(event, hint, currentScope) {
        const eventId = v4();

        if (hint && hint.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
            logger.log('An exception has been already caught, will not send it again');
            return eventId;
        }

        const hintWithEventId = {
            event_id: eventId,
            ...hint,
        };

        this._process(this._captureEvent(event, hintWithEventId, currentScope));

        return hintWithEventId.event_id;
    };

     getDsn() {
        return this._dsn;
    }

     getOptions() {
        return this.options
    }

     sendEvent(event, hint = {}) {
        this.emit('beforeSendEvent', event, hint);

        let envelope = createEventEnvelope(event, this._dsn, this.options.tunnel);

        console.log(envelope);

        const promise = this.sendEnvelope(envelope);
        if (promise) {
            promise.then(sendResponse => this.emit('afterSendEvent', event, sendResponse));
        }
    }

     sendEnvelope(envelope) {
        console.log('sending');

        this.emit('beforeEnvelope', envelope);

        if (this._isEnabled() && this._transport) {
            console.log('Sending envelope');

            return this._transport.send(envelope).then(null, (errorReason) => {
                console.error(`Error while sending event: ${errorReason}`);
                return errorReason;
            })
        }

        console.error('Transport is disabled.', this._isEnabled(), this._transport);
        return resolvedSyncPromise({});
    }

    emit(hook, event, sendResponse) {

    }

     _prepareEvent(event, hint, currentScope, isolationScope = getIsolationScope()) {
        const options = this.getOptions();

        this.emit('preprocessEvent', event, hint);

        return prepareEvent(options, event, hint).then((event) => {
            if (event === null) {
                return event;
            }

            return event;
        })
    };

    captureMessage(message, level, hint, currentScope) {
        const hintWithEventId = {
            event_id: v4(),
            ...hint,
        };

        const eventMessge = String(message);

        const promisedEvent = isPrimitive(message)
            ? this.eventFromException(eventMessge, hintWithEventId)
            : this.eventFromException(eventMessge, hintWithEventId);

        this._process(promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)));

        return hintWithEventId.event_id;
    }

    captureSession(session) {

    }

    getTransport() {
        return this._transport;
    }

    close(timeout) {
        return this.flush(timeout).then((result) => {
            this.getOptions().enabled = false;
            this.emit('close');
            return result;
        })
    }

    flush(timeout) {
        const transport = this._transport;
        if (transport) {
            this.emit('flush');
            return this._isClientDoneProcessing(timeout).then((done) => {
                return transport.flush(timeout).then((transportFlushed) => done && transportFlushed);
            });
        } else {
            return resolvedSyncPromise(true);
        }
    }

    init() {
        if (this._isEnabled()) ;
    }

     _isClientDoneProcessing(timeout) {
        return new SyncPromise(resolve => {
            let ticked = 0;
            const tick = 1;

            const interval = setInterval(() => {
                if (this._numProcessing == 0) {
                    clearInterval(interval);
                    resolve(true);
                } else {
                    ticked += tick;
                    if (timeout && ticked >= timeout) {
                        clearInterval(interval);
                        resolve(false);
                    }
                }
            }, tick);
        });
    }

     _captureEvent(event, hint = {}, scope) {
        return this._processEvent(event, hint, scope).then((finalEvent) => {
                return finalEvent.event_id;
            },
            (reason) => {
                const ribbanError = reason ;
                if (ribbanError.logLevel === 'log') {
                    console.log("LOG - " +  ribbanError.message);
                } else {
                    console.log("ERROR - " +  ribbanError);
                }

                return undefined;
            },
        );
    }

     _processEvent(event, hint, currentScope) {
        const options = this.getOptions();
        const { sampleRate } = options;

        const isError = isErrorEvent(event);
        const eventType = event.type || 'error';
        const beforeSendLabel = `before send for type \`${eventType}\``;

        const parsedSampleRate = typeof sampleRate === 'undefined' ? undefined : parseSampleRate(sampleRate);
        if (isError && typeof parsedSampleRate === 'number' && Math.random() > parsedSampleRate) {
            logger.log(`Item Sampling decision: dropped event with sampleRate ${parsedSampleRate}`);
            return rejectedSyncPromise(new RibbanError(
                `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`,
                'log',
            ));
        }
        console.log('Preprepared event: ', event);

        return this._prepareEvent(event, hint, currentScope).then((prepared) => {
            if (prepared === null) {
                throw new RibbanError('An event processor returned null, will not send event.', 'log');
            }

            const isInternalException = hint.data && (hint.data ).__ribban__ === true;
            if (isInternalException) {
                return prepared;
            }

            console.log('Prepared event: ', prepared);

            const result = processBeforeSend(options, prepared);
            return _validateBeforeSendResult(result, beforeSendLabel);
        }).then((processed) => {
            if (processed === null) {
                throw new RibbanError(`${beforeSendLabel} returned \`null\`, will not send event.`, 'log');
            }

            console.log('SENDING EVENT ', processed.event_id);

            this.sendEvent(processed, hint);
            return processed;
        }).then(null, (reason) => {
            if (reason instanceof RibbanError) {
                throw reason;
            }

            this.captureException(reason, {
                data: {
                    __ribban__: true,
                },
                originalException: reason
            });

            throw new RibbanError(`Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: ${reason}`);
        })
    }

    on(hook, callback) {

    }

     _isEnabled() {
        return this.getOptions().enabled !== false && this._transport !== undefined;
    }

     _process(promise) {
        this._numProcessing++;
        void promise.then((value) => {
            this._numProcessing--;
            return value;
        }, (reason) => {
            this._numProcessing--;
            return reason;
        });
    }
}

function _validateBeforeSendResult(
    beforeSendResult,
    beforeSendLabel
) {
    const invalidValueError = `${beforeSendLabel} method has to return 'null' or a valid event.`;
    if (isThenable(beforeSendResult)) {
        return beforeSendResult.then((processed) => {
            if (!isPlainObject(processed) && event !== null) {
                throw new RibbanError(invalidValueError);
            }

            return processed;
        }, (error) => {
            throw new RibbanError(`${beforeSendLabel} rejected with ${error}`);
        });
    } else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) {
        throw new RibbanError(invalidValueError);
    }

    return beforeSendResult;
}
function processBeforeSend(
    options,
    event,
    hint,
) {
    return event;
}

function isErrorEvent(event) {
    return event.type === undefined;
}

export { BaseClient };
//# sourceMappingURL=baseclient.js.map
