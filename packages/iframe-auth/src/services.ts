import { Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';

const handleAuthenticate = async (
  iframeElement: HTMLElement,
  provider: string,
  onSuccess?: (identity: Identity) => void,
  onError?: (error?: string) => void,
  iframeStyleQueries?: string
) => {
  const authClient = await AuthClient.create();

  await authClient.login({
    onSuccess: () => onSuccess && onSuccess(authClient.getIdentity()),
    onError: (error) => onError && onError(error),
    identityProvider: `${provider}/authenticate?${iframeStyleQueries}`,
    // idpWindowName: 'nfidIdpWindow',
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
export const IFrameAuthClient = (
  iframeElement: HTMLElement,
  provider: string,
  onSuccess?: (identity: Identity) => void,
  onError?: (error?: string) => void,
  iframeStyleQueries?: string
) => {
  const iframe = document.createElement('iframe');

  iframe.src = provider;
  iframe.title = 'nfidIdpWindow';
  iframe.name = 'nfidIdpWindow';
  iframe.allow = 'publickey-credentials-get';
  iframe.onload = () =>
    handleAuthenticate(
      iframeElement,
      provider,
      onSuccess,
      onError,
      iframeStyleQueries
    );

  // <iframe
  //   className={clsx(
  //     "w-full transition-all delay-300 h-full",
  //     isLoading && "opacity-0",
  //     className,
  //   )}
  //   src={src}
  //   frameBorder="0"
  //   title="nfidIdpWindow"
  //   name="nfidIdpWindow"
  //   allow="publickey-credentials-get"
  //   onLoad={handleOnLoad}
  // />
  console.log({ iframeElement, iframe });
  iframeElement.append(iframe);
};
