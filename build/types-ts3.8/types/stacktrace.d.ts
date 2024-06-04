import { StackFrame } from "./stackframe";
export interface Stacktrace {
    frames?: StackFrame[];
    frames_omitted?: [
        number,
        number
    ];
}
export type StackParser = (stack: string, skipFirstLines?: number, framesToPop?: number) => StackFrame[];
export type StackLineParserFn = (line: string) => StackFrame | undefined;
export type StackLineParser = [
    number,
    StackLineParserFn
];
export declare function stackParserFromStackParserOptions(stackParser: StackParser | StackLineParser[]): StackParser;
export declare const UNKNOWN_FUNCTION = "?";
export declare function createStackParser(...parsers: StackLineParser[]): StackParser;
export declare function stripRibbanFramesAndReverse(stack: ReadonlyArray<StackFrame>): StackFrame[];
//# sourceMappingURL=stacktrace.d.ts.map
