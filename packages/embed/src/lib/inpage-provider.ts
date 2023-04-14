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
    super(
      'https://eth-goerli.g.alchemy.com/v2/KII7f84ZxFDWMdnm_CNVW5hI8NfbnFhZ'
    );
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
        const iframe = getIframe();
        showIframe();
        return await request(iframe, { method, params }).then(
          (response: any) => {
            console.debug('NFIDInpageProvider.request eth_accounts', {
              response,
            });
            hideIframe();
            if (response.error) throw new Error(response.error.message);
            return response.result;
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
