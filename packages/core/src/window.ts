import { ClientEvents } from './credentials/client';
import { ProviderEvents } from './credentials/provider';

/** A reference to the current nfid sdk window */
let sdkWindow: Window | null;

const INTERRUPTION_CHECK_INTERVAL = 1000;

/**
 * Open a new sdk window to facilitate some credential verification.
 * @param url url string (todo: fixed?)
 * @param windowFeatures browser window features as string or object
 * @see {@link WindowFeatures}
 * @return void
 */
export function createWindow(
    url: string,
    windowFeatures?: WindowFeatures | string
) {
    // TODO: handle existing sessions
    sdkWindow = window.open(
        url,
        'nfidSdk',
        windowFeatures
            ? typeof windowFeatures === 'string'
                ? windowFeatures
                : stringifyWindowFeatures({
                      ...defaultWindowFeatures,
                      ...windowFeatures,
                  })
            : stringifyWindowFeatures(defaultWindowFeatures)
    );
    function checkInteruption() {}
    setTimeout(checkInteruption, INTERRUPTION_CHECK_INTERVAL);
}

/**
 * New window options as object or string.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/open#parameters
 */
interface WindowFeatures {
    toolbar?: boolean;
    location?: boolean;
    menubar?: boolean;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
}

/**
 * Default configuration for the sdk window.
 */
export const defaultWindowFeatures: WindowFeatures = {
    toolbar: false,
    location: false,
    menubar: false,
    width: 500,
    height: 500,
    top: 100,
    left: 100,
};

/**
 * Transform window features object to string
 * @param options WindowFeatures
 * @see {@link WindowFeatures}
 * @returns string
 */
export function stringifyWindowFeatures(options: WindowFeatures): string {
    function paramToString(key: string, value: any) {
        return `${key}=${typeof value === 'boolean' ? (value ? 1 : 0) : value}`;
    }
    return Object.entries(options).reduce(
        (agg, [k, v]) => `${agg}${paramToString(k, v)},`,
        ''
    );
}

/**
 * Send a message to the provider window.
 * @param event {@link ClientEvents}
 */
export function postMessageToProvider(event: ClientEvents) {
    sdkWindow?.postMessage(event);
}

/**
 * Send a message to the client window.
 * @param event {@link ProviderEvents}
 */
export function postMessageToClient(event: ProviderEvents) {
    window.opener.postMessage(event);
}
