import { _optionalChain } from '@sentry/utils';
import { isThenable } from '../transport/syncpromise.js';
import { constructWebpackConfigFunction } from './webpack.js';

function withRibbanConfig(nextConfig, ribbanBuildOptions = {}) {
    const castNextConfig = (nextConfig ) || {};
    if (typeof castNextConfig === 'function') {
        return function ( ...webpackConfigFunctionArgs) {
            const maybePromiseNextConfig = castNextConfig.apply(
                this,
                webpackConfigFunctionArgs,
            );

            if (isThenable(maybePromiseNextConfig)) {
                return maybePromiseNextConfig.then(promiseResultNextConfig => {
                    return getFinalConfigObject(promiseResultNextConfig, ribbanBuildOptions);
                });
            }

            return getFinalConfigObject(maybePromiseNextConfig, ribbanBuildOptions);
        } ;
    } else {
        return getFinalConfigObject(castNextConfig, ribbanBuildOptions) ;
    }
}

function getFinalConfigObject(
    incomingUserNextConfigObject,
    ribbanBuildOptions,
) {
    if ('ribban' in incomingUserNextConfigObject) {
        // eslint-disable-next-line no-console
        console.warn(
            '[@ribban/error-management] Setting a `ribban` property on the Next.js config is no longer supported. Please use the `ribbanSDKOptions` argument of `withRibbanConfig` instead.',
        );

        // Next 12.2.3+ warns about non-canonical properties on `userNextConfig`.
        delete incomingUserNextConfigObject.ribban;
    }

    if (_optionalChain([incomingUserNextConfigObject, 'access', _ => _.experimental, 'optionalAccess', _2 => _2.instrumentationHook]) === false) {
        // eslint-disable-next-line no-console
        console.warn(
            '[@ribban/error-management] You turned off the `instrumentationHook` option. Note that Sentry will not be initialized if you did not set it up inside `instrumentation.ts`.',
        );
    }

    incomingUserNextConfigObject.experimental = {
        instrumentationHook: true,
        ...incomingUserNextConfigObject.experimental,
    };

    return {
        ...incomingUserNextConfigObject,
        webpack: constructWebpackConfigFunction(incomingUserNextConfigObject, ribbanBuildOptions),
    };
}

export { withRibbanConfig };
//# sourceMappingURL=withRibbanConfig.js.map
