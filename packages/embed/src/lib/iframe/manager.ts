import { baseStyle, buildIframe } from './make-iframe';

export class IframeManager {
  private static _iframe: HTMLIFrameElement | undefined;

  static init({
    providerUrl,
    onLoad,
  }: {
    providerUrl: string;
    onLoad: () => void;
  }) {
    console.debug('IframeManager.constructor', { providerUrl });
    IframeManager._iframe = buildIframe({ origin: providerUrl, onLoad });
  }

  public static show() {
    if (!this._iframe) throw new Error('IframeManager not initialized');
    Object.assign(this._iframe.style, {
      ...baseStyle,
      display: 'block',
    });
  }
  public static hide() {
    if (!this._iframe) throw new Error('IframeManager not initialized');
    Object.assign(this._iframe.style, {
      ...baseStyle,
      display: 'none',
    });
  }

  public static isVisible() {
    return false;
  }
}
