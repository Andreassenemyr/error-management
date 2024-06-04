import { SpanAttributes, SpanTimeInput } from "../node/span/types";

export interface TimedEvent {
  name: string;
  time: SpanTimeInput;
  attributes?: SpanAttributes;
}