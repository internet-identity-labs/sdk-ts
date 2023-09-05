import { IFRAME_ID } from './constants';
import { getIframe } from './get-iframe';

export const baseStyle: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  top: '75px',
  right: '10px',
  border: 'none',
  borderRadius: '0.75rem',
  width: '440px',
  height: '580px',
  zIndex: '10',
  boxShadow: '0px 0px 60px 0px rgba(48,139,245,0.56)',
  background: 'white',
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
