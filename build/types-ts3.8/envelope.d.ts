import { HostComponent } from "./dsn";
import { Session, SessionAggregates } from "./session";
import { Envelope, EnvelopeItemType, Event, EventEnvelope, EventEnvelopeHeaders, SessionEnvelope } from "./types";
export declare function createEnvelope<E extends Envelope>(headers: E[0], items?: E[1]): E;
export declare function serializeEnvelope(envelope: Envelope): string | Uint8Array;
export type DataCategory = 'session' | 'attachment' | 'transaction' | 'error' | 'internal' | 'default' | 'profile' | 'replay' | 'monitor' | 'feedback' | 'metric_bucket' | 'span';
/**
 * Maps the type of an envelope item to a data category.
 */
export declare function envelopeItemTypeToDataCategory(type: EnvelopeItemType): DataCategory;
export declare function createEventEnvelope(event: Event, dsn?: HostComponent, tunnel?: string): EventEnvelope;
export declare function createSessionEnvelope(session: Session | SessionAggregates, dsn?: HostComponent, tunnel?: string): SessionEnvelope;
export declare function createEventEnvelopeHeaders(event: Event, tunnel: string | undefined, dsn?: HostComponent): EventEnvelopeHeaders;
//# sourceMappingURL=envelope.d.ts.map
