import * as uuid from "uuid"

export const RPC_BASE = { jsonrpc: "2.0" }

interface RPCBase {
  jsonrpc: string
  id: string
}

export interface RPCMessage extends RPCBase {
  method: string
  params: unknown[]
}

interface RPCSuccessResponse extends RPCBase {
  result: unknown
}

interface RPCErrorResponse extends RPCBase {
  error: {
    code: number
    message: string
    data: unknown
  }
}

export type RPCResponse = RPCSuccessResponse | RPCErrorResponse

type RPCRequestOptions = {
  timeout?: number
}

export async function request<T>(
  iframe: { contentWindow: Window },
  { method, params }: Omit<RPCMessage, "jsonrpc" | "id">,
  options: RPCRequestOptions = { timeout: 20000 }
) {
  const requestId = uuid.v4()
  const req = {
    jsonrpc: "2.0",
    id: requestId,
    method,
    params,
  }
  console.debug("request", { ...req })

  return new Promise<T>((resolve, reject) => {

    const timeout = options.timeout && setTimeout(() => {
      window.removeEventListener("message", handleEvent);
      // FIXME: check interface
      reject(new Error("timeout"))
    }, options.timeout)

    const handleEvent = (event: MessageEvent) => {
      if (event.data && event.data.id === requestId) {
        resolve(event.data);
        window.removeEventListener("message", handleEvent);
        timeout && clearTimeout(timeout)
      }
    }

    window.addEventListener("message", handleEvent);

    iframe.contentWindow.postMessage(req, "*")
  })
}
