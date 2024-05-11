import { logger } from "./logger";
import { addNonEnumerableProperty } from "./object";

export function checkOrSetAlreadyCaught(exception: unknown) {
    if (exception && (exception as any).__ribban_captured__) {
        return true;
    };

    try {
        addNonEnumerableProperty(exception as { [key: string]: unknown }, '__ribban_captured__', true)
    } catch (error) {

    };

    return false;
}

export function parseSampleRate(sampleRate: unknown): number | undefined {
    if (typeof sampleRate === 'boolean') {
      return Number(sampleRate);
    }
  
    const rate = typeof sampleRate === 'string' ? parseFloat(sampleRate) : sampleRate;
    if (typeof rate !== 'number' || isNaN(rate)) {
        logger.warn(
            `[Tracing] Given sample rate is invalid. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
              sampleRate,
            )} of type ${JSON.stringify(typeof sampleRate)}.`,
        );

        return undefined;
    }
  
    if (rate < 0 || rate > 1) {
        logger.warn(`[Tracing] Given sample rate is invalid. Sample rate must be between 0 and 1. Got ${rate}.`);
        return undefined;
    }
  
    return rate;
 }