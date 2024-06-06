import { GetModuleFn } from "../../api";
import { StackLineParser, StackLineParserFn } from "../../types/stacktrace";
export declare function filenameIsInApp(filename: string, isNative?: boolean): boolean;
export declare function node(getModule?: GetModuleFn): StackLineParserFn;
export declare function nodeStackLineParser(getModule?: GetModuleFn): StackLineParser;
//# sourceMappingURL=node-stack-trace.d.ts.map