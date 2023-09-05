import { IFRAME_ID } from './constants';
import { getIframe } from './get-iframe';

export const baseStyle: Partial<CSSStyleDeclaration> = {
  position: 'fixed',
  top: '0',
  left: '0',
  border: 'none',
  width: '100%',
  height: '100%',
  zIndex: '9999',
  background: 'rgba(9,10,19,0.5)',
  display: 'none',
};

type BuildIframeArgs = {
  origin: string;
  onLoad: () => void;
};

export const buildIframe = ({ origin, onLoad }: BuildIframeArgs) => {
  console.debug('makeIframe');
  const REQ_ACCOUNTS = 'embed';

  const PROVIDER_URL = new URL(`${origin}/${REQ_ACCOUNTS}`);

  let nfidIframe;
  try {
    nfidIframe = getIframe();
  } catch (e) {
    nfidIframe = document.createElement('iframe');
  }

  nfidIframe.id = IFRAME_ID;
  nfidIframe.src = PROVIDER_URL.href;
  nfidIframe.allow = 'publickey-credentials-get';

  Object.assign(nfidIframe.style, baseStyle);

  nfidIframe.onload = onLoad;
  document.body.appendChild(nfidIframe);

  return nfidIframe;
};
