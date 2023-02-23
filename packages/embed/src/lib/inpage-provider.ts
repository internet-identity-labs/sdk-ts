import { ethers } from 'ethers';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { request } from './postmsg-rpc';
import { getIframe } from './iframe/get-iframe';

export interface NFIDInpageProviderObservable {
  chainId: string | null;
  provider: ethers.providers.JsonRpcProvider;
  selectedAddress?: string;
}

export class NFIDInpageProvider extends ethers.providers.JsonRpcProvider {
  chainId = '0x5';
  provider = this;

  constructor() {
    super('https://ethereum-goerli-rpc.allthatnode.com');
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
      case 'eth_accounts': {
        const iframe = getIframe();
        showIframe();
        return await request(iframe, { method, params }).then(
          (response: any) => {
            console.debug('NFIDInpageProvider.request eth_accounts', {
              response,
            });
            hideIframe();
            return response.result ? response.result : response.error;
          }
        );
      }

      default: {
        console.debug('NFIDInpageProvider.request default', { method, params });
        return await this.send(method, params);
      }
    }
  }
}
