export { withRibbanConfig } from './config';
export * from './config';
export * from './client/index';
export * from './server';
import * as clientSdk from './client/index';
import { Options } from './options';
import * as serverSdk from './server';
export declare function init(options: Options | clientSdk.BrowserOptions | serverSdk.NodeOptions): void;
export declare const getClient: typeof clientSdk.getClient;
export declare function wrapApiHandlerWithRibban<APIHandler extends (...args: any[]) => any>(handler: APIHandler, parameterizedRoute: string): (...args: Parameters<APIHandler>) => ReturnType<APIHandler> extends Promise<unknown> ? ReturnType<APIHandler> : Promise<ReturnType<APIHandler>>;
//# sourceMappingURL=index.types.d.ts.map
