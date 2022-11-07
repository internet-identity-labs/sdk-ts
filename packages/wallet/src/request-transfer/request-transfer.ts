import {
  createWindow,
  defaultWindowFeatures,
  done,
  NFIDProviderConf,
  postMessageToProvider,
} from '@nfid/core';
import { validateEventOrigin } from '@nfid/core';
import { defaultProvider } from './default-provider';
import { RequestTransferProviderEvents } from './provider';

export type RequestTransferClientEvents =
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

const handleRequestTransferFactory = (
  resolve: (x: RequestTransferResult) => void,
  provider: URL,
  params: RequestTransferParams
) =>
  function handler(event: MessageEvent<RequestTransferProviderEvents>) {
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
