import { Client } from "../client";
import { ClientOptions } from "../options";
import { Event, EventHint } from "../types";
import { ExclusiveEventHintOrCaptureContext, Scope as ScopeInterface } from "../index";
export declare function prepareEvent(options: ClientOptions, event: Event, hint: EventHint, scope?: ScopeInterface, client?: Client): PromiseLike<Event | null>;
export declare function parseEventHintOrCaptureContext(hint: ExclusiveEventHintOrCaptureContext | undefined): EventHint | undefined;
//# sourceMappingURL=prepare-event.d.ts.map