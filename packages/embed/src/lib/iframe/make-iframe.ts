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
  applicationName?: string;
  applicationLogo?: string;
  onLoad: () => void;
};

const buildQuery = (params: { [key: string]: string | undefined }) => {
  console.debug('buildQuery', { params });
  const keys = Object.keys(params).filter((key) => Boolean(params[key]));
  return keys.length
    ? Object.keys(params).reduce((acc, key, index) => {
        const prefix = index === 0 ? '?' : '&';
        return `${acc}${prefix}${key}=${params[key]}`;
      }, '')
    : '';
};

export const buildIframe = ({
  origin,
  applicationLogo,
  applicationName,
  onLoad,
}: BuildIframeArgs) => {
  console.debug('buildIframe');
  const QUERY = buildQuery({ applicationLogo, applicationName });
  const PATH = 'embed';
  const PROVIDER_URL = new URL(`${origin}/${PATH}${QUERY}`);
  console.debug('buildIframe', { PROVIDER_URL, QUERY, PATH });

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
