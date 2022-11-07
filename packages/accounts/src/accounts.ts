import {
  createWindow,
  defaultWindowFeatures,
  done,
  NFIDProviderConf,
  postMessageToProvider,
} from '@nfid/core';
import { validateEventOrigin } from '@nfid/core';
import { defaultProvider } from './default-provider';
import { ProviderEvents } from './provider';

export type ClientEvents = { kind: 'Ready' } | { kind: 'RequestAccounts' };

export type RequestAccountsResult =
  | { status: 'SUCCESS'; accounts: string[] }
  | { status: 'REJECTED'; message: string }
  | { status: 'ERROR'; message: string };

export async function requestAccounts(
  config?: NFIDProviderConf
): Promise<RequestAccountsResult> {
  const provider = config?.provider || defaultProvider;
  const windowFeatures = config?.windowFeatures || defaultWindowFeatures;

  return new Promise<RequestAccountsResult>((resolve) => {
    const handler = handleRequestAccountsFactory(resolve, provider);
    window.addEventListener('message', handler);
    window.onbeforeunload = () => {
      window.removeEventListener('message', handler);
    };
    createWindow(
      provider.toString(),
      () => {
        window.removeEventListener('message', handler);
        resolve({
          status: 'ERROR',
          message: 'Terminated by user',
        });
      },
      windowFeatures
    );
  });
}

const handleRequestAccountsFactory = (
  resolve: (x: RequestAccountsResult) => void,
  provider: URL
) =>
  function handler(event: MessageEvent<ProviderEvents>) {
    if (!validateEventOrigin(event, provider.origin)) return;

    if (event.data.kind === 'Ready') {
      postMessageToProvider({
        kind: 'RequestAccounts',
      });
    }
    if (event.data.kind === 'RequestAccountsResponse') {
      window.removeEventListener('message', handler);
      resolve(event.data.result);
      done();
    }
  };
