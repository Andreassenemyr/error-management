/**
 * Use this attribute to represent the source of a span.
 * Should be one of: custom, url, route, view, component, task, unknown
 *
 */
export const SEMANTIC_ATTRIBUTE_RIBBAN_SOURCE = 'ribban.source';

/**
 * Use this attribute to represent the sample rate used for a span.
 */
export const SEMANTIC_ATTRIBUTE_RIBBAN_SAMPLE_RATE = 'ribban.sample_rate';

/**
 * Use this attribute to represent the operation of a span.
 */
export const SEMANTIC_ATTRIBUTE_RIBBAN_OP = 'ribban.op';

/**
 * Use this attribute to represent the origin of a span.
 */
export const SEMANTIC_ATTRIBUTE_RIBBAN_ORIGIN = 'ribban.origin';

/** The reason why an idle span finished. */
export const SEMANTIC_ATTRIBUTE_RIBBAN_IDLE_SPAN_FINISH_REASON = 'ribban.idle_span_finish_reason';

/** The unit of a measurement, which may be stored as a TimedEvent. */
export const SEMANTIC_ATTRIBUTE_RIBBAN_MEASUREMENT_UNIT = 'ribban.measurement_unit';

/** The value of a measurement, which may be stored as a TimedEvent. */
export const SEMANTIC_ATTRIBUTE_RIBBAN_MEASUREMENT_VALUE = 'ribban.measurement_value';

/**
 * The id of the profile that this span occured in.
 */
export const SEMANTIC_ATTRIBUTE_PROFILE_ID = 'ribban.profile_id';

export const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = 'ribban.exclusive_time';

export const SEMANTIC_ATTRIBUTE_CACHE_HIT = 'cache.hit';

export const SEMANTIC_ATTRIBUTE_CACHE_KEY = 'cache.key';

export const SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE = 'cache.item_size';