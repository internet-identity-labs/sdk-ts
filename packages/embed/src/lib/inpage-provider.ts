import { ethers } from 'ethers';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { request } from './postmsg-rpc';
import { getIframe } from './iframe/get-iframe';

export interface NFIDInpageProviderObservable {
  chainId: string | null;
  provider: ethers.providers.JsonRpcProvider;
  selectedAddress?: string;
}

const supportedChainIds = new Set(["0x01", "0x04", "0x05"])

export class NFIDInpageProvider {
  chainId: string;
  provider: ethers.providers.JsonRpcProvider;

  constructor(chainId: number, provider: ethers.providers.JsonRpcProvider) {
    const chainIdHex = ethers.utils.hexlify(chainId)
    this.checkChain(chainIdHex);
    this.chainId = chainIdHex;
    this.provider = provider
  }

  async request({
    method,
    params,
  }: {
    method: string;
    params: Array<any>;
    }): Promise<any> {
      console.debug('NFIDInpageProvider.request', { method, params });
      switch (method) {
        case 'eth_signTypedData_v4':
        case 'eth_sendTransaction':
        case 'personal_sign':
        case 'eth_accounts': {
          const meta = {chainId: this.chainId, rpcUrl: this.provider.connection.url }
          return this.execRequest(method, params, meta);
      }
      default: {
        console.debug('NFIDInpageProvider.request default', { method, params });
        return await this.provider.send(method, params);
      }
    }
  }

  private async execRequest(method: string, params: Array<any>, meta: {chainId: string, rpcUrl: string}): Promise<any> {
    const iframe = getIframe()
    showIframe()
    return await request(iframe, { method, params }, meta).then((response: any) => {
      console.debug('NFIDInpageProvider.request', {
        response,
      })

      hideIframe()

      if (response.error)
        throw new Error(response.error.message)

      return response.result
    });
  }

  private checkChain(chainId: string): void {
    if (!supportedChainIds.has(chainId)) {
      throw Error(`The chainid ${chainId} is not supported.`);
    }
  }
}
