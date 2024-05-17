import { Client } from "./client";
import { getCurrentScope } from "./current-scopes";
export { init } from "./init";
import { RequestSession } from "./session";
import { EventHint } from "./types";
import { parseEventHintOrCaptureContext } from "./utils/prepare-event";


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

    captureException(exception: unknown, hint?: unknown): string;

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