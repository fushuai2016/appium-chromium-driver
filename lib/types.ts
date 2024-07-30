import type {DriverCaps, W3CDriverCaps} from '@appium/types';
import type {CDConstraints} from './index';
export type * from './driver/types';
/**
 * W3C-style caps for {@link ChromiumDriver}
 * @public
 */
export type W3CChromiumDriverCaps = W3CDriverCaps<CDConstraints>;

/**
 * Capabilities for {@link ChromiumDriver}
 * @public
 */
export type ChromiumDriverCaps = DriverCaps<CDConstraints>;
