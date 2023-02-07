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
            return response.result ? response.result.hash : response.error
          })
      }

      case "eth_accounts": {
        return await request({ method, params })
          .then((response: any) => {
            console.debug("NFIDInpageProvider.request eth_accounts", { response })
            hideIframe()
            // TODO:
            // - [ ] add error handling
            return response.result
          })
      }

      default: {
        console.debug("NFIDInpageProvider.request default", { method, params })
        return await this.provider.send(method, params)
      }
    }
  },
}
