import { Primitive } from "../scope";
import { PolymorphicEvent } from "../types/polymorhics";
export declare function dropUndefinedKeys<T>(inputValue: T): T;
export declare function isDOMException(wat: unknown): boolean;
export declare function isDOMError(wat: unknown): boolean;
export declare function isPlainObject(wat: unknown): wat is Record<string, unknown>;
export declare function addNonEnumerableProperty(obj: object, name: string, value: unknown): void;
export declare function isPrimitive(wat: unknown): wat is Primitive;
export declare function isError(wat: unknown): wat is Error;
export declare function isInstanceOf(wat: any, base: any): boolean;
export declare function isRegExp(wat: unknown): wat is RegExp;
export declare function extractExceptionKeysForMessage(exception: Record<string, unknown>, maxLength?: number): string;
export declare function convertToPlainObject<V>(value: V): {
    [ownProps: string]: unknown;
    type: string;
    target: string;
    currentTarget: string;
    detail?: unknown;
} | {
    [ownProps: string]: unknown;
    message: string;
    name: string;
    stack?: string;
} | V;
/**
 * Checks whether given value's type is an Element instance
 * {@link isElement}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export declare function isElement(wat: unknown): boolean;
/**
 * Checks whether given value's type is ErrorEvent
 * {@link isErrorEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export declare function isErrorEvent(wat: unknown): boolean;
export declare function isString(wat: unknown): wat is string;
export declare function isEvent(wat: unknown): wat is PolymorphicEvent;
//# sourceMappingURL=object.d.ts.map