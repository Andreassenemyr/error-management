import { BrowserOptions } from '../client';
import { isBuild } from "../common/isBuild";
import { init as browserInit } from "../init";

export { withRibbanConfig } from '../config';
export { captureException } from '../index';


export function init(options: BrowserOptions) {
    if (isBuild()) {
        return;
    }

    browserInit(options);
}