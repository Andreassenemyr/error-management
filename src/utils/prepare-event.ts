import { Client } from "../client";
import { ClientOptions } from "../options";
import { Event, EventHint } from "../types";
import { v4 as uuiv4 } from "uuid";
import { CaptureContext, ExclusiveEventHintOrCaptureContext, ScopeContext, Scope as ScopeInterface } from "../index";
import { resolvedSyncPromise } from "../transport/syncpromise";
import { Scope } from "../scope";

export function prepareEvent(
    options: ClientOptions,
    event: Event,
    hint: EventHint,
    scope?: ScopeInterface,
    client?: Client,
): PromiseLike<Event | null> {
    const prepared: Event = {
        ...event,
        event_id: event.event_id || hint.event_id || uuiv4(),
        timestamp : event.timestamp || new Date().getSeconds(),
    };

    applyClientOptions(prepared, options);

    return resolvedSyncPromise(prepared);
};

function applyClientOptions(event: Event, options: ClientOptions): void {
    const { environment, maxValueLength = 250 } = options;

    if (!('environment' in event)) {
        event.environment = 'environment' in options ? environment : 'production';
    }

    if (event.message) {
        event.message = event.message.substring(0, maxValueLength);
    }

    const request = event.request;
    if (request && request.url) {
        request.url = request.url.substring(0, maxValueLength);
    }
}

export function parseEventHintOrCaptureContext(
    hint: ExclusiveEventHintOrCaptureContext | undefined,
): EventHint | undefined {
    if (!hint) {
      return undefined;
    }
  
    // If you pass a Scope or `() => Scope` as CaptureContext, we just return this as captureContext
    if (hintIsScopeOrFunction(hint)) {
      return { captureContext: hint };
    }
  
    if (hintIsScopeContext(hint)) {
      return {
        captureContext: hint,
      };
    }
  
    return hint;
}

function hintIsScopeOrFunction(
    hint: CaptureContext | EventHint,
): hint is ScopeInterface | ((scope: ScopeInterface) => ScopeInterface) {
    return hint instanceof Scope || typeof hint === 'function';
}
  
type ScopeContextProperty = keyof ScopeContext;
const captureContextKeys: readonly ScopeContextProperty[] = [
  'level',
  'extra',
  'tags',
  'fingerprint',
  'requestSession',
] as const;

function hintIsScopeContext(hint: Partial<ScopeContext> | EventHint): hint is Partial<ScopeContext> {
  return Object.keys(hint).some(key => captureContextKeys.includes(key as ScopeContextProperty));
}