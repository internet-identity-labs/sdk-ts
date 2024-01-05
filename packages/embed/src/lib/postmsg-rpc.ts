import * as uuid from 'uuid';

export const RPC_BASE = { jsonrpc: '2.0' };

interface RPCBase {
  jsonrpc: string;
  id: string;
}

type RequestTransferParams = {
  receiver: string;
  amount?: string;
  tokenId?: string;
  memo?: string;
  derivationOrigin?: string | URL;
};

type MethodParamsType = {
  ic_requestTransfer: RequestTransferParams | [RequestTransferParams];
  ic_getDelegation: unknown;
  ic_renewDelegation: unknown;
  ic_canisterCall: unknown;
  // Define param types for other methods here
};

export interface RPCMessage<T extends keyof MethodParamsType> extends RPCBase {
  method: T;
  params: MethodParamsType[T];
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

export type Method =
  | 'ic_getDelegation'
  | 'ic_renewDelegation'
  | 'ic_requestTransfer'
  | 'ic_canisterCall' /* add more method names as needed */;

export type MetadataRpcResponse = {
  id: number;
  jsonrpc: '2.0';
};

export type ErrorRpcResponse = MetadataRpcResponse & {
  error: {
    code: number;
    message: string;
    data: object;
  };
};

export type ResultRpcResponse<T> = MetadataRpcResponse & {
  result: T;
};

export type NFIDDelegationResult = MetadataRpcResponse & {
  userPublicKey: Uint8Array;
  delegations: {
    delegation: {
      pubkey: Uint8Array;
      expiration: bigint;
      targets?: string[];
    };
    signature: Uint8Array;
  }[];
};

export type TransferResponse = {
  hash: string;
};

export type CanisterCallResponse = {
  response: string;
};

export type RpcResponse<T> = ResultRpcResponse<T> | ErrorRpcResponse;

type MethodToReturnType = {
  ic_requestTransfer: RpcResponse<TransferResponse>;
  ic_getDelegation: RpcResponse<NFIDDelegationResult>;
  ic_renewDelegation: RpcResponse<NFIDDelegationResult>;
  ic_canisterCall: RpcResponse<CanisterCallResponse>;
  // Define return types for other methods here
};

class ProviderRpcError extends Error {
  constructor(message: string, public code: number, public data?: unknown) {
    super(message);
  }
}

export async function request<T extends Method>(
  iframe: { contentWindow: Window },
  { method, params }: Omit<RPCMessage<T>, 'jsonrpc' | 'id'>,
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
  console.debug('postmsg-rpc request', { ...req });

  return new Promise<MethodToReturnType[typeof method]>((resolve, reject) => {
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
