import { Principal } from '@dfinity/principal';
import * as uuid from 'uuid';
import { TransferStatus } from './inpage-provider';

export const RPC_BASE = { jsonrpc: '2.0' };

interface RPCBase {
  jsonrpc: string;
  id: string;
}

export interface RPCMessage extends RPCBase {
  method: string;
  params: unknown[];
}

interface RPCSuccessResponse extends RPCBase {
  result: unknown;
}

interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

interface RPCErrorResponse extends RPCBase {
  error: ProviderRpcError;
}

export type RPCResponse = RPCSuccessResponse | RPCErrorResponse;

type RPCRequestMetadata = {
  timeout?: number;
  chainId?: string;
  rpcUrl?: string;
};

type Method = 'ic_getDelegation' /* add more method names as needed */;

export type NFIDDelegationResult = {
  delegations: {
    delegation: {
      pubkey: Uint8Array;
      expiration: bigint;
      targets?: Principal[];
    };
    signature: Uint8Array;
  }[];
  userPublicKey: Uint8Array;
};

type MethodToReturnType = {
  ic_getDelegation: {
    result: NFIDDelegationResult;
  };
  ic_requestTransfer: {
    status: TransferStatus;
    message?: string;
    hash?: string;
  };
  // Define return types for other methods here
};

class ProviderRpcError extends Error {
  constructor(message: string, public code: number, public data?: unknown) {
    super(message);
  }
}

export async function request<T extends Method>(
  iframe: { contentWindow: Window },
  { method, params }: Omit<RPCMessage, 'jsonrpc' | 'id'>,
  options: RPCRequestMetadata = {}
) {
  const requestId = uuid.v4();
  const req = {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params,
    options,
  };
  console.debug('request', { ...req });

  return new Promise<MethodToReturnType[T]>((resolve, reject) => {
    const timeout =
      options.timeout &&
      setTimeout(() => {
        window.removeEventListener('message', handleEvent);
        reject(new ProviderRpcError('Request timed out', 408));
      }, options.timeout);

    const handleEvent = (event: MessageEvent) => {
      if (event.data && event.data.id === requestId) {
        console.debug(`resolve id: ${requestId}`, { event });
        resolve(event.data);
        window.removeEventListener('message', handleEvent);
        timeout && clearTimeout(timeout);
      }
    };

    window.addEventListener('message', handleEvent);

    iframe.contentWindow.postMessage(req, '*');
  });
}
