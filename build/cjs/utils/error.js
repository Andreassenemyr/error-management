Object.defineProperty(exports, '__esModule', { value: true });

class RibbanError extends Error {
    /** Display name of this error instance. */

     constructor( message, logLevel = 'warn') {
        super(message);this.message = message;
        this.name = new.target.prototype.constructor.name;
        // This sets the prototype to be `Error`, not `RibbanError`. It's unclear why we do this, but commenting this line
        // out causes various (seemingly totally unrelated) playwright tests consistently time out. FYI, this makes
        // instances of `RibbanError` fail `obj instanceof RibbanError` checks.
        Object.setPrototypeOf(this, new.target.prototype);
        this.logLevel = logLevel;
    }
}

exports.RibbanError = RibbanError;
//# sourceMappingURL=error.js.map
