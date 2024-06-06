import { Client } from "./client";
import { getCurrentScope } from "./current-scopes";
export { init } from "./init";
import { RequestSession } from "./session";
import { Event, EventHint, SeverityLevel } from "./types";
import { parseEventHintOrCaptureContext } from "./utils/prepare-event";
import { withRibbanConfig } from "./config/withRibbanConfig";

export type CaptureContext = Scope | Partial<ScopeContext> | ((scope: Scope) => Scope);

export type ExclusiveEventHintOrCaptureContext = 
    | (CaptureContext & Partial<{ [key in keyof EventHint]: never }>)
    | (EventHint & Partial<{ [key in keyof ScopeContext]: never }>);

export type Extra = unknown;
export type Extras = Record<string, Extra>;

export interface ScopeContext {
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    extra: Extras;
    tags: { [key: string]: string };
    fingerprint: string[];
    requestSession: RequestSession;
};

export interface Scope {
    addScopeListener(callback: (scope: Scope) => void): void;

    setTags(tags: { [key: string]: string }): this;

    setTag(key: string, value: string): this;

    setExtras(extras: Extras): this;

    setExtra(key: string, extra: Extra): this;

    setLevel(level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'): this;

    clear(): this;

    update(captureContext?: CaptureContext);

    /**
     * Returns the `RequestSession` if there is one
     */
    getRequestSession(): RequestSession | undefined;

    /**
     * Sets the `RequestSession` on the scope
     */
    setRequestSession(requestSession?: RequestSession): this;

    captureException(exception: unknown, hint?: EventHint): string;

    captureMessage(message: string, level?: SeverityLevel, hint?: EventHint): string;

    captureEvent(event: Event, hint?: EventHint): string;

    getClient<C extends Client>(): C | undefined;

    setClient(client: Client | undefined): void;

    clone(): Scope;
}

export function captureException(
    exception: any,
    hint?: ExclusiveEventHintOrCaptureContext,
) {    
    return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
}

export function captureEvent(event: Event, hint?: EventHint) {
    return getCurrentScope().captureEvent(event, hint);
}

export function captureMessage(
    message: string,
    level?: SeverityLevel,
    hint?: ExclusiveEventHintOrCaptureContext,
) {
    return getCurrentScope().captureMessage(message, level, parseEventHintOrCaptureContext(hint));
}   