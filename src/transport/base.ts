import { createEnvelope, serializeEnvelope } from "../envelope";
import { InternalBaseTransportOptions, Transport, TransportMakeRequestResponse, TransportRequestExecutor } from "../transport";
import { Envelope, EnvelopeItem, EnvelopeItemType, Event, EventItem } from "../types";
import { RibbanError } from "../utils/error";
import { logger } from "../utils/logger";
import { PromiseBuffer, makePromiseBuffer } from "./promisebuffer";
import { resolvedSyncPromise } from "./syncpromise";

export type RateLimits = Record<string, string>;

export function createTransport(
    options: InternalBaseTransportOptions,
    makeRequest: TransportRequestExecutor,
    buffer: PromiseBuffer<TransportMakeRequestResponse> = makePromiseBuffer(
        options.bufferSize || 64
    ),
): Transport {
    let rateLimits: RateLimits = {};
    const flush = (timeout?: number): PromiseLike<boolean> => buffer.drain(timeout);

    function send(envelope: Envelope): PromiseLike<TransportMakeRequestResponse> {
        const filteredEnvelopeItems: EnvelopeItem[] = [];

        forEachEnvelopeItem(envelope, (item, type) => {
            filteredEnvelopeItems.push(item);
        });

        if (filteredEnvelopeItems.length == 0) {
            return resolvedSyncPromise({});
        }

        const filteredEnvelope: Envelope = createEnvelope(envelope[0], filteredEnvelopeItems as any);

        const recordEnvelopeLoss = (reason: 'before_send' | 'event_processor' | 'network_error' | 'queue_overflow'): void => {
            forEachEnvelopeItem(filteredEnvelope, (item, type) => {
                const event: Event | undefined = getEventForEnvelopeItem(item, type);
                
            })
        };

        const requestTask = (): PromiseLike<TransportMakeRequestResponse> => 
            makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
                response => {
                    if (response.statusCode !== undefined && (response.statusCode < 200 && response.statusCode >= 300)) {
                        console.warn(`Ribban responded with status code ${response.statusCode} to sent event.`);
                    }
                    
                    return response;
                },
                error => {
                    recordEnvelopeLoss('network_error');
                    throw error;
                }
            )

        return buffer.add(requestTask).then(
            result => result,
            error => {
                if (error instanceof RibbanError) {
                    logger.warn('Skipped sending event because buffer is full.');
                    recordEnvelopeLoss('queue_overflow');
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

export function forEachEnvelopeItem<E extends Envelope>(
    envelope: Envelope,
    callback: (envelopeItem: E[1][number], envelopeItemType: E[1][number][0]['type']) => boolean | void,
  ): boolean {
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
  

function getEventForEnvelopeItem(item: Envelope[1][number], type: EnvelopeItemType): Event | undefined {
    if (type !== 'event' && type !== 'transaction') {
      return undefined;
    }
  
    return Array.isArray(item) ? (item as EventItem)[1] : undefined;
}