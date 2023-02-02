import { AuthClient } from '@dfinity/auth-client';
import { IHandleAuthenticate, IIFrameAuthClient } from './types';

const handleAuthenticate = async ({
  provider,
  onSuccess,
  onError,
  authClientConfig,
}: IHandleAuthenticate) => {
  const authClient = await AuthClient.create();

  await authClient.login({
    onSuccess: () => onSuccess && onSuccess(authClient.getIdentity()),
    onError: (error) => onError && onError(error),
    identityProvider: `${provider}/authenticate`,
    idpWindowName: 'nfidIdpWindow',
    ...authClientConfig,
  });
};

/**
 * Render authentication iframe, based on @dfinity/auth-client
 * @param iframeElement HTMLElement where iframe should be rendered
 * @param provider url string
 * @param onSuccess success callback
 * @param onError error callback
 * @param iframeStyleQueries PREMIUM FEATURE | Custom iframe styling
 * @return void
 */

export const IFrameAuthClient = ({
  iframeElement,
  provider,
  onSuccess,
  onError,
  iframeStyleQueries,
}: IIFrameAuthClient) => {
  const iframe = document.createElement('iframe');

  iframe.src = `${provider}/authenticate?${iframeStyleQueries}`;
  iframe.title = 'nfidIdpWindow';
  iframe.name = 'nfidIdpWindow';
  iframe.allow = 'publickey-credentials-get';
  iframe.onload = () =>
    handleAuthenticate({
      provider,
      onSuccess,
      onError,
    });

  iframeElement.append(iframe);
};
