import { Client } from "./client";
export { init } from "./init";
import { RequestSession } from "./session";
import { Event, EventHint, SeverityLevel } from "./types";
export type CaptureContext = Scope | Partial<ScopeContext> | ((scope: Scope) => Scope);
export type ExclusiveEventHintOrCaptureContext = (CaptureContext & Partial<{
    [key in keyof EventHint]: never;
}>) | (EventHint & Partial<{
    [key in keyof ScopeContext]: never;
}>);
export type Extra = unknown;
export type Extras = Record<string, Extra>;
export interface ScopeContext {
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    extra: Extras;
    tags: {
        [key: string]: string;
    };
    fingerprint: string[];
    requestSession: RequestSession;
}
export interface Scope {
    addScopeListener(callback: (scope: Scope) => void): void;
    setTags(tags: {
        [key: string]: string;
    }): this;
    setTag(key: string, value: string): this;
    setExtras(extras: Extras): this;
    setExtra(key: string, extra: Extra): this;
    setLevel(level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'): this;
    clear(): this;
    update(captureContext?: CaptureContext): any;
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
export declare function captureException(exception: any, hint?: ExclusiveEventHintOrCaptureContext): string;
export declare function captureEvent(event: Event, hint?: EventHint): string;
export declare function captureMessage(message: string, level?: SeverityLevel, hint?: ExclusiveEventHintOrCaptureContext): string;
//# sourceMappingURL=index.d.ts.map