import { BehaviorSubject } from "rxjs"
import { ethers } from "ethers"
import { hideIframe, showIframe } from "./iframe/mount-iframe"
import { request } from "./postmsg-rpc"


export interface NFIDInpageProviderObservable {
  chainId: string | null
  provider: ethers.providers.JsonRpcProvider
  selectedAddress?: string
}

const nfidInpageProvider$ = new BehaviorSubject<NFIDInpageProviderObservable>({
  chainId: "0x5",
  provider: new ethers.providers.JsonRpcProvider(
    "https://ethereum-goerli-rpc.allthatnode.com",
  )
})

export interface NFIDInpageProvider extends NFIDInpageProviderObservable {
  request({ method, params }: { method: string, params: Array<any> }): Promise<any>
}

export const nfidInpageProvider: NFIDInpageProvider = {
  get chainId() { return nfidInpageProvider$.value.chainId },
  get selectedAddress() { return nfidInpageProvider$.value.selectedAddress },
  get provider() {
    return nfidInpageProvider$.value.provider
  },

  async request({ method, params }) {
    console.debug("NFIDInpageProvider.request", { method, params })
    switch (method) {
      case "eth_chainId":
        return this.chainId
      // FIXME:
      // delegated to default provider
      case "eth_gasPrice": {
        const result = await this.provider.getGasPrice()
        return result.toHexString()
      }

      case "eth_estimateGas": {
        if (!params) throw new Error("eth_estimateGas: missing params")
        // const { from, to, value } = params[0]
        // const result = await this.provider.estimateGas({ from, to, value: 1 })
        // return result.toHexString()
        // eslint-disable-next-line no-undef
        const gasPrice = await this.provider.getGasPrice()
        console.debug("NFIDInpageProvider.response eth_estimateGas", { gasPrice })
        // debugger
        // const hexlified = ethers.utils.hexlify(response)
        // debugger
        // console.debug("NFIDInpageProvider.response eth_estimateGas", { response, hexlified })
        return 21000
      }

      case "eth_getTransactionByHash": {
        if (!params) throw new Error("eth_getTransactionByHash: missing params")
        console.debug("eth_getTransactionByHash", { method, params })
        return await this.provider.getTransaction(params[0])
      }

      case "eth_getBlockByNumber": {
        return await this.provider.getBlockNumber()
      }

      case "eth_getTransactionReceipt": {
        if (!params) throw new Error("eth_getTransactionReceipt: missing params")
        const response = await this.provider.getTransactionReceipt(params[0])
        console.debug("eth_getTransactionReceipt", { response, params, hash: params[0] })

        return response
      }

      case "eth_call": {
        console.warn("eth_call not implemented", { method, params })
        return null
      }

      case "eth_signTypedData_v4":
      case "eth_sendTransaction": {
        if (!params) throw new Error(`${method} missing params`)
        showIframe()
        return await request({ method, params })
          .then((response: any) => {
            console.debug(`NFIDInpageProvider.response ${method}`, { response })
            hideIframe()
            // TODO:
            // - [ ] add error handling
            return response.data.result ? response.data.result.hash : response.data.error
          })
      }

      case "eth_accounts": {
        return await request({ method, params })
          .then((response: any) => {
            console.debug("NFIDInpageProvider.request eth_accounts", { response })
            hideIframe()
            // TODO:
            // - [ ] add error handling
            return response.data.result
          })
      }

      default: {
        console.error("NFIDInpageProvider.request missing message", { method, params })
      }
    }
  },
}
