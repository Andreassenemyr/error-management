function stackParserFromStackParserOptions(stackParser) {
    if (Array.isArray(stackParser)) {
        return createStackParser(...stackParser);
    }
    return stackParser;
}

const STACKTRACE_FRAME_LIMIT = 50;
const UNKNOWN_FUNCTION = '?';
// Used to sanitize webpack (error: *) wrapped stack errors
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STRIP_FRAME_REGEXP = /captureMessage|captureException/;

function createStackParser(...parsers) {
    const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map(p => p[1]);

    return (stack, skipFirstLines = 0, framesToPop = 0) => {
        const frames = [];
        const lines = stack.split('\n');

        for (let i = skipFirstLines; i < lines.length; i++) {
            const line = lines[i];
            // Ignore lines over 1kb as they are unlikely to be stack frames.
            // Many of the regular expressions use backtracking which results in run time that increases exponentially with
            // input size. Huge strings can result in hangs/Denial of Service:
            if (line.length > 1024) {
              continue;
            }

            // Remove webpack (error: *) wrappers
            const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, '$1') : line;

            // Skip Error: lines
            if (cleanedLine.match(/\S*Error: /)) {
              continue;
            }

            for (const parser of sortedParsers) {
              const frame = parser(cleanedLine);

              if (frame) {
                frames.push(frame);
                break;
              }
            }

            if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) {
              break;
            }
        }

        return stripRibbanFramesAndReverse(frames.slice(framesToPop));
    };
}

function stripRibbanFramesAndReverse(stack) {
    if (!stack.length) {
        return [];
    }

    const localStack = Array.from(stack);

    // If stack starts with one of our API calls, remove it (starts, meaning it's the top of the stack - aka last call)
    if (/ribbanWrapped/.test(localStack[localStack.length - 1].function || '')) {
        localStack.pop();
    }

    // Reversing in the middle of the procedure allows us to just pop the values off the stack
    localStack.reverse();

    // If stack ends with one of our internal API calls, remove it (ends, meaning it's the bottom of the stack - aka top-most call)
    if (STRIP_FRAME_REGEXP.test(localStack[localStack.length - 1].function || '')) {
        localStack.pop();

        // When using synthetic events, we will have a 2 levels deep stack, as `new Error('Ribban syntheticException')`
        // is produced within the hub itself, making it:
        //
        //   Ribban.captureException()
        //   getCurrentHub().captureException()
        //
        // instead of just the top `Ribban` call itself.
        // This forces us to possibly strip an additional frame in the exact same was as above.
        if (STRIP_FRAME_REGEXP.test(localStack[localStack.length - 1].function || '')) {
          localStack.pop();
        }
    }

    return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map(frame => ({
        ...frame,
        filename: frame.filename || localStack[localStack.length - 1].filename,
        function: frame.function || UNKNOWN_FUNCTION,
    }));
}

export { UNKNOWN_FUNCTION, createStackParser, stackParserFromStackParserOptions, stripRibbanFramesAndReverse };
//# sourceMappingURL=stacktrace.js.map
