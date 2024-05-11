import { Extras, Scope } from "./index";
import { AsyncContextStack } from "./async-context";
import { BaseClient } from "./baseclient";
import { getMainCarrier, getRibbanCarrier } from "./carrier";
import { getCurrentScope, getIsolationScope } from "./current-scopes";
import { HostComponent } from "./dsn";
import { ClientOptions } from "./options";
import { Session, SessionAggregates } from "./session";
import { SessionFlusher } from "./sessionflusher";
import { BaseTransportOptions, Transport, TransportMakeRequestResponse } from "./transport";
import { resolvedSyncPromise } from "./transport/syncpromise";
import { Envelope, Event, EventHint, NodeClientOptions, SeverityLevel } from "./types";
import { Exception } from "./types/exception";
import { Mechanism } from "./types/mechanism";
import { StackFrame } from "./types/stackframe";
import { StackParser } from "./types/stacktrace";
import { logger } from "./utils/logger";
import { normalizeToSize } from "./utils/normalize";
import { extractExceptionKeysForMessage, isError, isErrorEvent, isPlainObject } from "./utils/object";

/**
 * User-Facing Sentry SDK Client.
 *
 * This interface contains all methods to interface with the SDK once it has
 * been installed. It allows to send events to Sentry, record breadcrumbs and
 * set a context included in every event. Since the SDK mutates its environment,
 * there will only be one instance during runtime.
 *
 */
export interface Client<O extends ClientOptions = ClientOptions> {
    /**
     * Captures an exception event and sends it to Sentry.
     *
     * Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
     *
     * @param exception An exception-like object.
     * @param hint May contain additional information about the original exception.
     * @param currentScope An optional scope containing event metadata.
     * @returns The event id
     */
    captureException(exception: any, hint?: EventHint, currentScope?: Scope): string;
  
    /**
     * Captures a message event and sends it to Sentry.
     *
     * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
     *
     * @param message The message to send to Sentry.
     * @param level Define the level of the message.
     * @param hint May contain additional information about the original exception.
     * @param currentScope An optional scope containing event metadata.
     * @returns The event id
     */
    captureMessage(message: string, level?: SeverityLevel, hint?: EventHint, currentScope?: Scope): string;
  
    /**
     * Captures a manually created event and sends it to Sentry.
     *
     * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
     *
     * @param event The event to send to Sentry.
     * @param hint May contain additional information about the original exception.
     * @param currentScope An optional scope containing event metadata.
     * @returns The event id
     */
    captureEvent(event: Event, hint?: EventHint, currentScope?: Scope): string;
  
    /**
     * Captures a session
     *
     * @param session Session to be delivered
     */
    captureSession(session: Session): void;
  
    /** Returns the current Dsn. */
    getDsn(): HostComponent | undefined;
  
    /** Returns the current options. */
    getOptions(): O;
  
  
    /**
     * Returns the transport that is used by the client.
     * Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
     *
     * @returns The transport.
     */
    getTransport(): Transport | undefined;
  
    /**
     * Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
     *
     * @param timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
     *   the client to wait until all events are sent before disabling itself.
     * @returns A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
     * it doesn't.
     */
    close(timeout?: number): PromiseLike<boolean>;
  
    /**
     * Wait for all events to be sent or the timeout to expire, whichever comes first.
     *
     * @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
     *   cause the client to wait until all events are sent before resolving the promise.
     * @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
     * still events in the queue when the timeout is reached.
     */
    flush(timeout?: number): PromiseLike<boolean>;
  
    /**
     * Initialize this client.
     * Call this after the client was set on a scope.
     */
    init(): void;
  
    /** Creates an {@link Event} from all inputs to `captureException` and non-primitive inputs to `captureMessage`. */
    eventFromException(exception: any, hint?: EventHint): PromiseLike<Event>;
  
    /** Submits the event to Sentry */
    sendEvent(event: Event, hint?: EventHint): void;

    
    /** Submits the session to Sentry */
    sendSession(session: Session | SessionAggregates): void;
  
    /** Sends an envelope to Sentry */
    sendEnvelope(envelope: Envelope): PromiseLike<TransportMakeRequestResponse>;
  
    // HOOKS
    /* eslint-disable @typescript-eslint/unified-signatures */
  
    /**
     * Register a callback for transaction start and finish.
     */
    on(hook: 'beforeEnvelope', callback: (envelope: Envelope) => void): void;
  
    /**
     * Register a callback for before sending an event.
     * This is called right before an event is sent and should not be used to mutate the event.
     * Receives an Event & EventHint as arguments.
     */
    on(hook: 'beforeSendEvent', callback: (event: Event, hint?: EventHint | undefined) => void): void;
  
    /**
     * Register a callback for preprocessing an event,
     * before it is passed to (global) event processors.
     * Receives an Event & EventHint as arguments.
     */
    on(hook: 'preprocessEvent', callback: (event: Event, hint?: EventHint | undefined) => void): void;
  
    /**
     * Register a callback for when an event has been sent.
     */
    on(hook: 'afterSendEvent', callback: (event: Event, sendResponse: TransportMakeRequestResponse) => void): void;

    /**
     * A hook that is called when the client is flushing
     */
    on(hook: 'flush', callback: () => void): void;
  
    /**
     * A hook that is called when the client is closing
     */
    on(hook: 'close', callback: () => void): void;
  
    /*
     * Fire a hook event for envelope creation and sending. Expects to be given an envelope as the
     * second argument.
     */
    emit(hook: 'beforeEnvelope', envelope: Envelope): void;
  
    /**
     * Fire a hook event before sending an event.
     * This is called right before an event is sent and should not be used to mutate the event.
     * Expects to be given an Event & EventHint as the second/third argument.
     */
    emit(hook: 'beforeSendEvent', event: Event, hint?: EventHint): void;
  
    /**
     * Fire a hook event to process events before they are passed to (global) event processors.
     * Expects to be given an Event & EventHint as the second/third argument.
     */
    emit(hook: 'preprocessEvent', event: Event, hint?: EventHint): void;
  
    /*
     * Fire a hook event after sending an event. Expects to be given an Event as the
     * second argument.
     */
    emit(hook: 'afterSendEvent', event: Event, sendResponse: TransportMakeRequestResponse): void;

    /**
     * Emit a hook event for client flush
     */
    emit(hook: 'flush'): void;
  
    /**
     * Emit a hook event for client close
     */
    emit(hook: 'close'): void;
  
    /* eslint-enable @typescript-eslint/unified-signatures */
}

export interface ServerRuntimeClientOptions extends ClientOptions<BaseTransportOptions> {
    platform?: string;
    runtime?: { name: string; version?: string };
    serverName?: string;
}
  

export class ServerRuntimeClient <O extends ClientOptions & ServerRuntimeClientOptions = ServerRuntimeClientOptions> extends BaseClient<O> {
    protected _sessionFlusher: SessionFlusher | undefined;
    
    public constructor(options: O) {
        super(options);
    }

    public eventFromException(exception: any, hint?: EventHint | undefined): PromiseLike<Event> {
        return resolvedSyncPromise(eventFromUnknownInput(this, this.options.stackParser, exception, hint));
    }

    public captureException(exception: any, hint?: EventHint | undefined, currentScope?: Scope | undefined): string {
        if (this.options.autoSessionTracking && this._sessionFlusher) {
            const requestSession = getIsolationScope()?.getRequestSession();

            if (requestSession && requestSession.status === 'ok') {
                requestSession.status = 'errored';
            }
        }

        return super.captureException(exception, hint, currentScope);
    }

    public captureEvent(event: Event, hint?: EventHint | undefined, currentScope?: Scope | undefined): string {
        if (this.options.autoSessionTracking && this._sessionFlusher) {
            const eventType = event.type || 'exception';
            const isException = eventType === 'exception' && event.exception && event.exception.values && event.exception.values.length > 0;

            if (isException) {
                const requestSession = getIsolationScope().getRequestSession();

                if (requestSession && requestSession.status === 'ok') {
                    requestSession.status = 'errored';
                }
            }
        }

        return super.captureEvent(event, hint, currentScope);
    }

    protected _captureRequestSession(): void {
        if (!this._sessionFlusher) {
            logger.warn('Discarded request mode session because autoSessionTracking option was disabled');
        } else {
            this._sessionFlusher.incrementSessionStatusCount();
        }
    }

    close(timeout?: number | undefined): PromiseLike<boolean> {
        if (this._sessionFlusher) {
            this._sessionFlusher.close();
        }

        return super.close(timeout);
    }

    public initSessionFlusher(): void {
        const { environment } = this.options;
        
        this._sessionFlusher = new SessionFlusher(this, {
            environment, 
        });                           
    }
};

export class NodeClient extends ServerRuntimeClient<NodeClientOptions> {
    public constructor(options: NodeClientOptions) {
        super(options);
    };

    flush(timeout?: number | undefined): PromiseLike<boolean> {
        return super.flush(timeout);
    }
};

export function eventFromUnknownInput(
    client: Client,
    stackParser: StackParser,
    exception: unknown,
    hint?: EventHint,
): Event {
    const mechanism: Mechanism = {
        handled: true,
        type: 'generic',
    };

    const [ex, extras] = getException(client, mechanism, exception, hint);

    const event: Event = {
        exception: {
            values: [exceptionFromError(stackParser, ex)]
        }
    };

    if (extras) {
        event.extra = extras;
    };

    return {
        ...event,
        event_id: hint && hint.event_id,
    }

}

export function setCurrentClient(client: Client): void {
    getCurrentScope().setClient(client);
    registerClientOnGlobalHub(client);
}

function registerClientOnGlobalHub(client: Client): void {
    const ribbanGlobal = getRibbanCarrier(getMainCarrier()) as { hub?: AsyncContextStack };
    if (ribbanGlobal.hub && typeof ribbanGlobal.hub.getStackTop === 'function') {
        ribbanGlobal.hub.getStackTop().client = client;
    }
}
  

function getException(
    client: Client,
    mechanism: Mechanism,
    exception: unknown,
    hint?: EventHint,
): [Error, Extras | undefined] {
    if (isError(exception)) {
        return [exception, undefined];
    }
  
    // Mutate this!
    mechanism.synthetic = true;
  
    if (isPlainObject(exception)) {
        const normalizeDepth = client && client.getOptions().normalizeDepth;
        const extras = { ['__serialized__']: normalizeToSize(exception as Record<string, unknown>, normalizeDepth) };
        
        const errorFromProp = getErrorPropertyFromObject(exception);
        if (errorFromProp) {
            return [errorFromProp, extras];
        }
      
        const message = getMessageForObject(exception);
        const ex = (hint && hint.syntheticException) || new Error(message);
        ex.message = message;
      
        return [ex, extras];
    }
  
    // This handles when someone does: `throw "something awesome";`
    // We use synthesized Error here so we can extract a (rough) stack trace.
    const ex = (hint && hint.syntheticException) || new Error(exception as string);
    ex.message = `${exception}`;
  
    return [ex, undefined];
}
  
function getMessageForObject(exception: Record<string, unknown>): string {
    if ('name' in exception && typeof exception.name === 'string') {
        let message = `'${exception.name}' captured as exception`;
        
        if ('message' in exception && typeof exception.message === 'string') {
            message += ` with message '${exception.message}'`;
        }
      
        return message;
    } else if ('message' in exception && typeof exception.message === 'string') {
        return exception.message;
    }
  
    const keys = extractExceptionKeysForMessage(exception);
  
    // Some ErrorEvent instances do not have an `error` property, which is why they are not handled before
    // We still want to try to get a decent message for these cases
    if (isErrorEvent(exception)) {
        return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
    }
  
    const className = getObjectClassName(exception);
  
    return `${className && className !== 'Object' ? `'${className}'` : 'Object'} captured as exception with keys: ${keys}`;
}

function getObjectClassName(obj: unknown): string | undefined | void {
    try {
        const prototype: unknown | null = Object.getPrototypeOf(obj);
        return prototype ? prototype.constructor.name : undefined;
    } catch (e) {
        // ignore errors here
    }
}
  

export function exceptionFromError(stackParser: StackParser, error: Error): Exception {
    const exception: Exception = {
        type: error.name || error.constructor.name,
        value: error.message,
    };
  
    const frames = parseStackFrames(stackParser, error);
    if (frames.length) {
        exception.stacktrace = { frames };
    }
  
    return exception;
}

export function parseStackFrames(stackParser: StackParser, error: Error): StackFrame[] {
    return stackParser(error.stack || '', 1);
}

function getErrorPropertyFromObject(obj: Record<string, unknown>): Error | undefined {
    for (const prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            const value = obj[prop];
            if (value instanceof Error) {
                return value;
            }
        }
    }
  
    return undefined;
}
  