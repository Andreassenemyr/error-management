import { CaptureContext, Extras } from "./index";
import { HostComponent } from "./dsn";
import { Primitive } from "./scope";
import { SerializedSession, Session, SessionAggregates } from "./session";
import { Exception } from "./types/exception";
export interface BaseNodeOptions {
    serverName?: string;
    onFatalError?(this: void, error: Error): void;
}
export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
export type DynamicSamplingContext = {
    trace_id: string;
    public_key: HostComponent['publicKey'];
    sample_rate?: string;
    release?: string;
    environment?: string;
    transaction?: string;
    replay_id?: string;
    sampled?: string;
};
export type EnvelopeItemType = 'client_report' | 'user_report' | 'feedback' | 'session' | 'sessions' | 'transaction' | 'attachment' | 'event' | 'profile' | 'replay_event' | 'replay_recording' | 'check_in' | 'statsd' | 'span';
export type BaseEnvelopeHeaders = {
    [key: string]: unknown;
    dsn?: string;
};
export type BaseEnvelopeItemHeaders = {
    [key: string]: unknown;
    type: EnvelopeItemType;
    length?: number;
};
type BaseEnvelopeItem<ItemHeader, P> = [
    ItemHeader & BaseEnvelopeItemHeaders,
    P
];
type BaseEnvelope<EnvelopeHeader, Item> = [
    EnvelopeHeader & BaseEnvelopeHeaders,
    Array<Item & BaseEnvelopeItem<BaseEnvelopeItemHeaders, unknown>>
];
type EventItemHeaders = {
    type: 'event' | 'transaction' | 'profile' | 'feedback';
};
export type EventItem = BaseEnvelopeItem<EventItemHeaders, Event>;
export type EventEnvelopeHeaders = {
    event_id: string;
    sent_at: string;
    trace?: DynamicSamplingContext;
};
export type EventEnvelope = BaseEnvelope<EventEnvelopeHeaders, EventItem>;
type SessionItemHeaders = {
    type: 'session';
};
type SessionAggregatesItemHeaders = {
    type: 'sessions';
};
export type SessionItem = BaseEnvelopeItem<SessionItemHeaders, Session | SerializedSession> | BaseEnvelopeItem<SessionAggregatesItemHeaders, SessionAggregates>;
type SessionEnvelopeHeaders = {
    sent_at: string;
};
export type SessionEnvelope = BaseEnvelope<SessionEnvelopeHeaders, SessionItem>;
export type Envelope = EventEnvelope | SessionEnvelope;
export type EnvelopeItem = Envelope[1][number];
export interface Request {
    url?: string;
    method?: string;
    data?: any;
    query_string?: QueryParams;
    cookies?: {
        [key: string]: string;
    };
    env?: {
        [key: string]: string;
    };
    headers?: {
        [key: string]: string;
    };
}
export type QueryParams = string | {
    [key: string]: string;
} | Array<[
    string,
    string
]>;
export type ServerComponentContext = {
    componentRoute: string;
    componentType: 'Page' | 'Layout' | 'Head' | 'Not-found' | 'Loading' | 'Unknown';
    headers?: WebFetchHeaders;
};
export interface WebFetchHeaders {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callbackfn: (value: string, key: string, parent: WebFetchHeaders) => void): void;
}
export interface WebFetchRequest {
    readonly headers: WebFetchHeaders;
    readonly method: string;
    readonly url: string;
    clone(): WebFetchRequest;
}
export interface Event {
    event_id?: string;
    message?: string;
    logentry?: {
        message?: string;
        params?: string[];
    };
    timestamp?: number;
    start_timestamp?: number;
    level?: SeverityLevel;
    platform?: string;
    logger?: string;
    server_name?: string;
    release?: string;
    dist?: string;
    environment?: string;
    request?: Request;
    transaction?: string;
    modules?: {
        [key: string]: string;
    };
    fingerprint?: string[];
    exception?: {
        values?: Exception[];
    };
    tags?: {
        [key: string]: Primitive;
    };
    extra?: Extras;
    type?: EventType;
    sdkProcessingMetadata?: {
        [key: string]: any;
    };
}
export type EventType = 'transaction' | 'profile' | 'replay_event' | 'feedback' | undefined;
export interface ErrorEvent extends Event {
    type: undefined;
}
export interface TransactionEvent extends Event {
    type: 'transaction';
}
export interface EventHint {
    event_id?: string;
    captureContext?: CaptureContext;
    syntheticException?: Error;
    originalException?: unknown;
    data?: any;
}
export {};
//# sourceMappingURL=types.d.ts.map
