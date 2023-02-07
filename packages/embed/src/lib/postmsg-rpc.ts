import { fromEvent } from "rxjs"
import { first } from "rxjs/operators"

import * as uuid from "uuid"
import { getIframe } from "./iframe/get-iframe"

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


export async function request<T>({ method, params }: Omit<RPCMessage, "jsonrpc" | "id">) {
  const requestId = uuid.v4()
  const req = {
    jsonrpc: "2.0",
    id: requestId,
    method,
    params,
  }
  console.debug("request", { ...req })

  return new Promise<T>((resolve, reject) => {
    const iframe = getIframe()

    if (!iframe || iframe.contentWindow === null) {
      return reject(new Error("nfid iframe not initialized"))
    }


    const handleEvent = (event: MessageEvent) => {
      if (event.data && event.data.id === requestId) {
        resolve(event.data);
        window.removeEventListener("message", handleEvent);
      }
    }

    window.addEventListener("message", handleEvent);

    iframe.contentWindow.postMessage(req, "*")
  })
}
