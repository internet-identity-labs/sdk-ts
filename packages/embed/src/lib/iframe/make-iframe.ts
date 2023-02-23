import { IFRAME_ID } from './constants';

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
};

export const buildIframe = (onLoad: () => void) => {
  console.debug('makeIframe');
  const NFID_ORIGIN = 'http://localhost:9090';
  const REQ_ACCOUNTS = 'embed';

  const PROVIDER_URL = new URL(`${NFID_ORIGIN}/${REQ_ACCOUNTS}`);

  const nfidIframe = document.createElement('iframe');
  nfidIframe.id = IFRAME_ID;
  nfidIframe.src = PROVIDER_URL.href;
  Object.assign(nfidIframe.style, baseStyle);

  nfidIframe.onload = onLoad;
  document.body.appendChild(nfidIframe);

  return nfidIframe;
};
