import { LoaderThis } from "./types";
type LoaderOptions = {
    values: Record<string, unknown>;
};
/**
 * Set values on the global/window object at the start of a module.
 *
 * Options:
 *   - `values`: An object where the keys correspond to the keys of the global values to set and the values
 *        correspond to the values of the values on the global object. Values must be JSON serializable.
 */
export default function valueInjectionLoader(this: LoaderThis<LoaderOptions>, userCode: string): string;
export {};
//# sourceMappingURL=valueInjectionLoader.d.ts.map