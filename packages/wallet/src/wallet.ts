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

export type ClientEvents =
  | { kind: 'Ready' }
  | { kind: 'RequestTransfer'; params: RequestTransferParams };

export type RequestTransferResult =
  | { status: 'SUCCESS'; height: number }
  | { status: 'REJECTED'; message: string }
  | { status: 'ERROR'; message: string };

export interface RequestTransferParams {
  to: string;
  amount: number;
}

export async function requestTransfer(
  params: RequestTransferParams,
  config?: NFIDProviderConf
): Promise<RequestTransferResult> {
  const provider = config?.provider || defaultProvider;
  const windowFeatures = config?.windowFeatures || defaultWindowFeatures;

  return new Promise<RequestTransferResult>((resolve) => {
    const handler = handleRequestTransferFactory(resolve, provider, params);
    window.addEventListener('message', handler);
    createWindow(
      provider.toString(),
      () =>
        resolve({
          status: 'ERROR',
          message: 'Terminated by user',
        }),
      windowFeatures
    );
  });
}

const handleRequestTransferFactory = (
  resolve: (x: RequestTransferResult) => void,
  provider: URL,
  params: RequestTransferParams
) =>
  function handler(event: MessageEvent<ProviderEvents>) {
    if (!validateEventOrigin(event, provider.origin)) return;

    if (event.data.kind === 'Ready') {
      postMessageToProvider({
        kind: 'RequestTransfer',
        params,
      });
    }
    if (event.data.kind === 'RequestTransferResponse') {
      window.removeEventListener('message', handler);
      resolve(event.data.result);
      done();
    }
  };
