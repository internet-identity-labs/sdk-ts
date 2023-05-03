import { getIframe } from './get-iframe';
import { baseStyle } from './make-iframe';

type MountIframeParams = {
  iframe: HTMLIFrameElement;
  onLoad: () => void;
};

export const mountIframe = async ({ iframe, onLoad }: MountIframeParams) => {
  console.debug('mountIframe', { iframe });
  window.document.body.appendChild(iframe);
  iframe.onload = onLoad;
};

export const showIframe = async () => {
  const iframe = getIframe();
  if (!iframe) return;
  console.debug('showIframe', { iframe });
  Object.assign(iframe.style, {
    display: 'block',
    ...baseStyle,
  });
};

export const hideIframe = async () => {
  const iframe = getIframe();
  if (!iframe) return;
  console.debug('hideIframe', { iframe });
  Object.assign(iframe.style, {
    display: 'none',
    ...baseStyle,
  });
};
