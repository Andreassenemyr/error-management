import { Scope } from "./index";
import { BaseClient } from "./baseclient";
import { HostComponent } from "./dsn";
import { ClientOptions } from "./options";
import { Session, SessionAggregates } from "./session";
import { BaseTransportOptions, Transport, TransportMakeRequestResponse } from "./transport";
import { Envelope, Event, EventHint, SeverityLevel } from "./types";
import { Exception } from "./types/exception";
import { StackFrame } from "./types/stackframe";
import { StackParser } from "./types/stacktrace";
import { ParameterizedString } from "./utils/parameterize";
/**
 * User-Facing Ribban SDK Client.
 *
 * This interface contains all methods to interface with the SDK once it has
 * been installed. It allows to send events to Ribban, record breadcrumbs and
 * set a context included in every event. Since the SDK mutates its environment,
 * there will only be one instance during runtime.
 *
 */
export interface Client<O extends ClientOptions = ClientOptions> {
    /**
     * Captures an exception event and sends it to Ribban.
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
     * Captures a message event and sends it to Ribban.
     *
     * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
     *
     * @param message The message to send to Ribban.
     * @param level Define the level of the message.
     * @param hint May contain additional information about the original exception.
     * @param currentScope An optional scope containing event metadata.
     * @returns The event id
     */
    captureMessage(message: string, level?: SeverityLevel, hint?: EventHint, currentScope?: Scope): string;
    /**
     * Captures a manually created event and sends it to Ribban.
     *
     * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
     *Ribban
     * @param event The event to send to Ribban.
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
    /** Submits the event to Ribban */
    sendEvent(event: Event, hint?: EventHint): void;
    /** Submits the session to Ribban */
    sendSession(session: Session | SessionAggregates): void;
    /** Sends an envelope to Ribban */
    sendEnvelope(envelope: Envelope): PromiseLike<TransportMakeRequestResponse>;
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
    emit(hook: 'afterSendEvent', event: Event, sendResponse: TransportMakeRequestResponse): void;
    /**
     * Emit a hook event for client flush
     */
    emit(hook: 'flush'): void;
    /**
     * Emit a hook event for client close
     */
    emit(hook: 'close'): void;
}
export interface ServerRuntimeClientOptions extends ClientOptions<BaseTransportOptions> {
    platform?: string;
    runtime?: {
        name: string;
        version?: string;
    };
    serverName?: string;
}
/**
 * Options added to the Browser SDK's init options that are specific for Replay.
 * Note: This type was moved to @sentry/types to avoid a circular dependency between Browser and Replay.
 */
export type BrowserClientReplayOptions = {
    /**
     * The sample rate for session-long replays.
     * 1.0 will record all sessions and 0 will record none.
     */
    replaysSessionSampleRate?: number;
    /**
     * The sample rate for sessions that has had an error occur.
     * This is independent of `sessionSampleRate`.
     * 1.0 will record all sessions and 0 will record none.
     */
    replaysOnErrorSampleRate?: number;
};
export type BrowserClientProfilingOptions = {
    /**
     * The sample rate for profiling
     * 1.0 will profile all transactions and 0 will profile none.
     */
    profilesSampleRate?: number;
};
export interface BrowserTransportOptions extends BaseTransportOptions {
    /** Fetch API init parameters. Used by the FetchTransport */
    fetchOptions?: RequestInit;
    /** Custom headers for the transport. Used by the XHRTransport and FetchTransport */
    headers?: {
        [key: string]: string;
    };
}
export type BrowserClientOptions = ClientOptions<BrowserTransportOptions> & BrowserClientReplayOptions & BrowserClientProfilingOptions & {
    /** If configured, this URL will be used as base URL for lazy loading integration. */
    cdnBaseUrl?: string;
};
export declare class BrowserClient extends BaseClient<BrowserClientOptions> {
    constructor(options: BrowserClientOptions);
    flush(timeout?: number | undefined): PromiseLike<boolean>;
    eventFromException(exception: any, hint?: EventHint | undefined): PromiseLike<Event>;
    eventFromMessage(message: string, level?: SeverityLevel, hint?: EventHint): PromiseLike<Event>;
    protected _prepareEvent(event: Event, hint: EventHint, currentScope?: Scope | undefined): PromiseLike<Event | null>;
}
export declare function eventFromClientUnknownInput(client: Client, stackParser: StackParser, exception: unknown, hint?: EventHint): Event;
export declare function eventFromUnknownInput(stackParser: StackParser, exception: unknown, syntheticException?: Error, attachStacktrace?: boolean, isUnhandledRejection?: boolean): Event;
export declare function eventFromMessage(stackParser: StackParser, message: ParameterizedString, level?: SeverityLevel, hint?: EventHint, attachStacktrace?: boolean): PromiseLike<Event>;
export declare function eventFromException(stackParser: StackParser, exception: unknown, hint?: EventHint, attachStacktrace?: boolean): PromiseLike<Event>;
export declare function setCurrentClient(client: Client): void;
export declare function exceptionFromError(stackParser: StackParser, error: Error): Exception;
export declare function parseStackFrames(stackParser: StackParser, error: Error): StackFrame[];
//# sourceMappingURL=client.d.ts.map
