import { isThenable } from "../transport/syncpromise";
import { NextConfigFunction, RibbanBuildOptions, ExportedNextConfig as NextConfig, NextConfigObject } from "./types";
import { constructWebpackConfigFunction } from "./webpack";

export function withRibbanConfig<C>(nextConfig?: C, ribbanBuildOptions: RibbanBuildOptions = {}): C {
    const castNextConfig = (nextConfig as NextConfig) || {};
    if (typeof castNextConfig === 'function') {
        return function (this: unknown, ...webpackConfigFunctionArgs: unknown[]): ReturnType<NextConfigFunction> {
            const maybePromiseNextConfig: ReturnType<typeof castNextConfig> = castNextConfig.apply(
                this,
                webpackConfigFunctionArgs,
            );

            if (isThenable(maybePromiseNextConfig)) {
                return maybePromiseNextConfig.then(promiseResultNextConfig => {
                    return getFinalConfigObject(promiseResultNextConfig, ribbanBuildOptions);
                });
            }

            return getFinalConfigObject(maybePromiseNextConfig, ribbanBuildOptions);
        } as C;
    } else {
        return getFinalConfigObject(castNextConfig, ribbanBuildOptions) as C;
    }
}

function getFinalConfigObject(
    incomingUserNextConfigObject: NextConfigObject,
    ribbanBuildOptions: RibbanBuildOptions,
): NextConfigObject {
    if ('ribban' in incomingUserNextConfigObject) {
        // eslint-disable-next-line no-console
        console.warn(
            '[@ribban/error-management] Setting a `ribban` property on the Next.js config is no longer supported. Please use the `ribbanSDKOptions` argument of `withRibbanConfig` instead.',
        );

        // Next 12.2.3+ warns about non-canonical properties on `userNextConfig`.
        delete incomingUserNextConfigObject.ribban;
    }

    if (incomingUserNextConfigObject.experimental?.instrumentationHook === false) {
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