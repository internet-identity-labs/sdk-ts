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

type RPCRequestOptions = {
  timeout?: number;
};

class ProviderRpcError extends Error {
  constructor(message: string, public code: number, public data?: unknown) {
    super(message);
  }
}

export async function request<T>(
  iframe: { contentWindow: Window },
  req: RPCMessage,
  options: RPCRequestOptions = {}
) {
  return new Promise<T>((resolve, reject) => {
    const timeout =
      options.timeout &&
      setTimeout(() => {
        window.removeEventListener('message', handleEvent);
        reject(new ProviderRpcError('Request timed out', 408));
      }, options.timeout);

    const handleEvent = (event: MessageEvent) => {
      if (event.data && event.data.id === req.id) {
        resolve(event.data);
        window.removeEventListener('message', handleEvent);
        timeout && clearTimeout(timeout);
      }
    };

    window.addEventListener('message', handleEvent);

    iframe.contentWindow.postMessage(req, '*');
  });
}
