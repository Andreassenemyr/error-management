import { CaptureContext, Extras } from "./index";
import { HostComponent } from "./dsn";
import { Options } from "./options";
import { Primitive } from "./scope";
import { SerializedSession, Session, SessionAggregates } from "./session";
import { Exception } from "./types/exception";
import { BrowserClientProfilingOptions, BrowserClientReplayOptions, BrowserTransportOptions } from "./client";
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
type BaseEnvelopeItem<ItemHeader, P> = [ItemHeader & BaseEnvelopeItemHeaders, P];
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
export type BrowserOptions = Options<BrowserTransportOptions> & BrowserClientReplayOptions & BrowserClientProfilingOptions;
export type QueryParams = string | {
    [key: string]: string;
} | Array<[string, string]>;
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
    contexts?: Contexts;
    breadcrumbs?: Breadcrumb[];
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
export type Context = Record<string, unknown>;
export interface Contexts extends Record<string, Context | undefined> {
    app?: AppContext;
    device?: DeviceContext;
    os?: OsContext;
    culture?: CultureContext;
    response?: ResponseContext;
    cloud_resource?: CloudResourceContext;
    state?: StateContext;
    profile?: ProfileContext;
}
export interface StateContext extends Record<string, unknown> {
    state: {
        type: string;
        value: Record<string, unknown>;
    };
}
export interface AppContext extends Record<string, unknown> {
    app_name?: string;
    app_start_time?: string;
    app_version?: string;
    app_identifier?: string;
    build_type?: string;
    app_memory?: number;
    free_memory?: number;
}
export interface DeviceContext extends Record<string, unknown> {
    name?: string;
    family?: string;
    model?: string;
    model_id?: string;
    arch?: string;
    battery_level?: number;
    orientation?: 'portrait' | 'landscape';
    manufacturer?: string;
    brand?: string;
    screen_resolution?: string;
    screen_height_pixels?: number;
    screen_width_pixels?: number;
    screen_density?: number;
    screen_dpi?: number;
    online?: boolean;
    charging?: boolean;
    low_memory?: boolean;
    simulator?: boolean;
    memory_size?: number;
    free_memory?: number;
    usable_memory?: number;
    storage_size?: number;
    free_storage?: number;
    external_storage_size?: number;
    external_free_storage?: number;
    boot_time?: string;
    processor_count?: number;
    cpu_description?: string;
    processor_frequency?: number;
    device_type?: string;
    battery_status?: string;
    device_unique_identifier?: string;
    supports_vibration?: boolean;
    supports_accelerometer?: boolean;
    supports_gyroscope?: boolean;
    supports_audio?: boolean;
    supports_location_service?: boolean;
}
export interface OsContext extends Record<string, unknown> {
    name?: string;
    version?: string;
    build?: string;
    kernel_version?: string;
}
export interface CultureContext extends Record<string, unknown> {
    calendar?: string;
    display_name?: string;
    locale?: string;
    is_24_hour_format?: boolean;
    timezone?: string;
}
export interface ResponseContext extends Record<string, unknown> {
    type?: string;
    cookies?: string[][] | Record<string, string>;
    headers?: Record<string, string>;
    status_code?: number;
    body_size?: number;
}
export interface CloudResourceContext extends Record<string, unknown> {
    ['cloud.provider']?: string;
    ['cloud.account.id']?: string;
    ['cloud.region']?: string;
    ['cloud.availability_zone']?: string;
    ['cloud.platform']?: string;
    ['host.id']?: string;
    ['host.type']?: string;
}
export interface ProfileContext extends Record<string, unknown> {
    profile_id: string;
}
/**
 * Sentry uses breadcrumbs to create a trail of events that happened prior to an issue.
 * These events are very similar to traditional logs but can record more rich structured data.
 *
 * @link https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/
 */
export interface Breadcrumb {
    /**
     * By default, all breadcrumbs are recorded as default, which makes them appear as a Debug entry, but Sentry provides
     * other types that influence how the breadcrumbs are rendered. For more information, see the description of
     * recognized breadcrumb types.
     *
     * @summary The type of breadcrumb.
     * @link https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
     */
    type?: string;
    /**
     * Allowed values are, from highest to lowest:
     * `fatal`, `error`, `warning`, `info`, and `debug`.
     * Levels are used in the UI to emphasize and deemphasize the crumb. The default is `info`.
     *
     * @summary This defines the severity level of the breadcrumb.
     */
    level?: SeverityLevel;
    event_id?: string;
    /**
     * Typically it is a module name or a descriptive string. For instance, `ui.click` could be used to
     * indicate that a click happened in the UI or flask could be used to indicate that the event originated in
     * the Flask framework.
     * @private Internally we render some crumbs' color and icon based on the provided category.
     *          For more information, see the description of recognized breadcrumb types.
     * @summary A dotted string indicating what the crumb is or from where it comes.
     * @link    https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
     */
    category?: string;
    /**
     * If a message is provided, it is rendered as text with all whitespace preserved.
     *
     * @summary Human-readable message for the breadcrumb.
     */
    message?: string;
    /**
     * Contains a dictionary whose contents depend on the breadcrumb type.
     * Additional parameters that are unsupported by the type are rendered as a key/value table.
     *
     * @summary Arbitrary data associated with this breadcrumb.
     */
    data?: {
        [key: string]: any;
    };
    /**
     * The format is a numeric (integer or float) value representing
     * the number of seconds that have elapsed since the Unixepoch.
     * Breadcrumbs are most useful when they include a timestamp, as it creates a timeline
     * leading up to an event expection/error.
     *
     * @note The API supports a string as defined in RFC 3339, but the SDKs only support a numeric value for now.
     *
     * @summary A timestamp representing when the breadcrumb occurred.
     * @link https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#:~:text=is%20info.-,timestamp,-(recommended)
     */
    timestamp?: number;
}
/** JSDoc */
export interface BreadcrumbHint {
    [key: string]: any;
}
export interface FetchBreadcrumbData {
    method: string;
    url: string;
    status_code?: number;
    request_body_size?: number;
    response_body_size?: number;
}
export interface XhrBreadcrumbData {
    method?: string;
    url?: string;
    status_code?: number;
    request_body_size?: number;
    response_body_size?: number;
}
export interface FetchBreadcrumbHint {
    input: any[];
    data?: unknown;
    response?: unknown;
    startTimestamp: number;
    endTimestamp: number;
}
export interface XhrBreadcrumbHint {
    xhr: unknown;
    input: unknown;
    startTimestamp: number;
    endTimestamp: number;
}
export {};
//# sourceMappingURL=types.d.ts.map