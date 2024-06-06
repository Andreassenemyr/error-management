import { Scope } from "./index";
import { getEnvelopeEndpointWithUrlEncodedAuth } from "./api";
import { Client } from "./client";
import { HostComponent, createDSN } from "./dsn";
import { ClientOptions } from "./options";
import { Transport, TransportMakeRequestResponse } from "./transport";
import { logger } from "./utils/logger";
import { v4 as uuidv4 } from 'uuid';
import { checkOrSetAlreadyCaught, parseSampleRate } from "./utils/misc";
import { Envelope, ErrorEvent, Event, EventEnvelope, EventHint, SeverityLevel } from "./types";
import { SyncPromise, isThenable, rejectedSyncPromise, resolvedSyncPromise } from "./transport/syncpromise";
import { RibbanError } from "./utils/error";
import { DataCategory, createEventEnvelope, createSessionEnvelope } from "./envelope";
import { prepareEvent } from "./utils/prepare-event";
import { Session, SessionAggregates } from "./session";
import { isPlainObject, isPrimitive } from "./utils/object";
import { getIsolationScope } from "./current-scopes";

export abstract class BaseClient<O extends ClientOptions> implements Client<O> {
    protected readonly options: O;

    protected readonly _dsn?: HostComponent;
    protected readonly _transport?: Transport

    protected _numProcessing: number;

    constructor(options: O) {
        this.options = options;
        this._numProcessing = 0;

        if (options.dsn) {
            this._dsn = createDSN(options.dsn);
        } else {
            logger.warn('No DSN was provided, the client will not send any requests.')
        }

        console.log(this._dsn)

        if (this._dsn) {
            const url = getEnvelopeEndpointWithUrlEncodedAuth(
                this._dsn,
                this.options.tunnel
            )

            this._transport = options.transport({
                tunnel: this.options.tunnel,
                ...options.transportOptions,
                url: url,
            })
        }
    };
    
    public captureException(exception: any, hint?: EventHint | undefined, currentScope?: Scope | undefined): string {
        const eventId = uuidv4();

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

    
    sendSession(session: Session | SessionAggregates): void {
        const env = createSessionEnvelope(session, this._dsn, this.options.tunnel);

        this.sendEnvelope(env);
    }

    captureEvent(event: Event, hint?: EventHint | undefined, currentScope?: Scope | undefined): string {
        const eventId = uuidv4();

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

    public abstract eventFromException(_exception: any, _hint?: EventHint): PromiseLike<Event>;

    public getDsn(): HostComponent | undefined {
        return this._dsn;
    }

    public getOptions(): O {
        return this.options
    }
    

    public sendEvent(event: Event, hint: EventHint = {}): void {
        this.emit('beforeSendEvent', event, hint);

        let envelope = createEventEnvelope(event, this._dsn, this.options.tunnel);

        console.log(envelope)

        const promise = this.sendEnvelope(envelope);
        if (promise) {
            promise.then(sendResponse => this.emit('afterSendEvent', event, sendResponse));
        }
    }

    public sendEnvelope(envelope: Envelope): PromiseLike<TransportMakeRequestResponse> {
        console.log('sending')

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
    
    emit(hook: "beforeEnvelope", envelope: Envelope): void;
    emit(hook: "beforeSendEvent", event: Event, hint?: EventHint | undefined): void;
    emit(hook: "preprocessEvent", event: Event, hint?: EventHint | undefined): void;
    emit(hook: "afterSendEvent", event: Event, sendResponse: TransportMakeRequestResponse): void;
    emit(hook: "flush"): void;
    emit(hook: "close"): void;
    emit(hook: unknown, event?: unknown, sendResponse?: unknown): void {
        
    }

    protected _prepareEvent(event: Event, hint: EventHint, currentScope?: Scope | undefined, isolationScope = getIsolationScope()): PromiseLike<Event | null> {
        const options = this.getOptions();

        this.emit('preprocessEvent', event, hint);

        return prepareEvent(options, event, hint, currentScope, this).then((event) => {
            if (event === null) {
                return event;
            }


            return event;
        })
    };

    captureMessage(message: string, level?: SeverityLevel | undefined, hint?: EventHint | undefined, currentScope?: Scope | undefined): string {
        const hintWithEventId = {
            event_id: uuidv4(),
            ...hint,
        };

        const eventMessge = String(message);

        const promisedEvent = isPrimitive(message) 
            ? this.eventFromException(eventMessge, hintWithEventId)
            : this.eventFromException(eventMessge, hintWithEventId);

        this._process(promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)));

        return hintWithEventId.event_id;
    }

    captureSession(session: Session): void {
        
    }

    getTransport(): Transport | undefined {
        return this._transport;
    }

    close(timeout?: number | undefined): PromiseLike<boolean> {
        return this.flush(timeout).then((result) => {
            this.getOptions().enabled = false;
            this.emit('close');
            return result;
        })
    }

    flush(timeout?: number | undefined): PromiseLike<boolean> {
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

    init(): void {
        if (this._isEnabled()) {
            
        }
    }

    protected _isClientDoneProcessing(timeout?: number): PromiseLike<boolean> {
        return new SyncPromise(resolve => {
            let ticked: number = 0;
            const tick: number = 1;
            
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

    protected _captureEvent(event: Event, hint: EventHint = {}, scope?: Scope): PromiseLike<string | undefined> {
        return this._processEvent(event, hint, scope).then((finalEvent) => {
                return finalEvent.event_id;
            },
            (reason) => {
                const ribbanError = reason as RibbanError;
                if (ribbanError.logLevel === 'log') {
                    console.log("LOG - " +  ribbanError.message);
                } else {
                    console.log("ERROR - " +  ribbanError);
                }

                return undefined;
            },
        );
    }

    protected _processEvent(event: Event, hint: EventHint, currentScope?: Scope): PromiseLike<Event> {
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
        };

        const dataCategory: DataCategory = eventType === 'replay_event' ? 'replay' : eventType;

        console.log('Preprepared event: ', event);

        return this._prepareEvent(event, hint, currentScope).then((prepared) => {
            if (prepared === null) {
                throw new RibbanError('An event processor returned null, will not send event.', 'log');
            }

            const isInternalException = hint.data && (hint.data as { __ribban__: boolean }).__ribban__ === true;
            if (isInternalException) {
                return prepared;
            }

            console.log('Prepared event: ', prepared)

            const result = processBeforeSend(options, prepared, hint);
            return _validateBeforeSendResult(result, beforeSendLabel);
        }).then((processed) => {
            if (processed === null) {
                throw new RibbanError(`${beforeSendLabel} returned \`null\`, will not send event.`, 'log');
            }

            console.log('SENDING EVENT ', processed.event_id)

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
    
    on(hook: "beforeEnvelope", callback: (envelope: EventEnvelope) => void): void;
    on(hook: "beforeSendEvent", callback: (event: Event, hint?: EventHint | undefined) => void): void;
    on(hook: "preprocessEvent", callback: (event: Event, hint?: EventHint | undefined) => void): void;
    on(hook: "afterSendEvent", callback: (event: Event, sendResponse: TransportMakeRequestResponse) => void): void;
    on(hook: "flush", callback: () => void): void;
    on(hook: "close", callback: () => void): void;
    on(hook: string, callback: unknown): void {
        
    }

    protected _isEnabled(): boolean {
        return this.getOptions().enabled !== false && this._transport !== undefined;
    }

    protected _process<T>(promise: PromiseLike<T>): void {
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
    beforeSendResult: PromiseLike<Event | null> | Event | null,
    beforeSendLabel: string
): PromiseLike<Event | null> | Event | null {
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
};

function processBeforeSend(
    options: ClientOptions,
    event: Event,
    hint: EventHint,
): PromiseLike<Event | null> | Event | null {
    return event;
}


function isErrorEvent(event: Event): event is ErrorEvent {
    return event.type === undefined;
}